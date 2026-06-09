import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomInt } from 'crypto';
import { Repository } from 'typeorm';
import { Cita } from '../citas/entities/cita.entity';
import { Payment } from './entities/payment.entity';
import { PaymentMethod } from './enums/payment-method.enum';
import { PaymentStatus } from './enums/payment-status.enum';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Cita)
    private readonly citaRepo: Repository<Cita>,
    private readonly activityService: ActivityService,
    private readonly configService: ConfigService,
  ) {}

  async generateToken(
    appointmentId: number,
    method: PaymentMethod,
    mockApproved?: boolean,
  ): Promise<Payment> {
    const cita = await this.citaRepo.findOne({
      where: { id: appointmentId },
      relations: { usuario: true, servicio: true },
    });
    if (!cita) {
      throw new NotFoundException('Cita no encontrada');
    }

    const existingPayment = await this.paymentRepo.findOneBy({ appointmentId });
    if (existingPayment) {
      throw new ConflictException('La cita ya tiene un pago asociado');
    }

    const payment = this.paymentRepo.create({
      appointmentId,
      appointment: cita,
      method,
      status: PaymentStatus.PENDING,
      tokenUsed: false,
      tokenCode: null,
      tokenExpiresAt: null,
    });

    if (method === PaymentMethod.CASH) {
      // Efectivo: genera token inmediatamente
      payment.status = PaymentStatus.PENDING;
      const { tokenCode, tokenExpiresAt } = await this.buildToken();
      payment.tokenCode = tokenCode;
      payment.tokenExpiresAt = tokenExpiresAt;
    } else if (method === PaymentMethod.WOMPI) {
      // Wompi: genera link de pago
      const wompiPayment = await this.createWompiPayment(cita);
      payment.wompiPaymentLink = wompiPayment.paymentLink;
      payment.wompiReference = wompiPayment.reference;
      payment.status = PaymentStatus.PENDING;
    } else {
      throw new BadRequestException('Método de pago inválido');
    }

    const saved = await this.paymentRepo.save(payment);

    try {
      await this.activityService.logActivity(
        'PAGO_GENERADO',
        `Pago generado para cita #${appointmentId} con método ${method}`,
        'pago',
        appointmentId.toString(),
        'sistema',
        'sistema',
      );
    } catch (error) {
      console.error('Error logging activity:', error);
    }

    const full = await this.paymentRepo.findOne({
      where: { id: saved.id },
      relations: { appointment: true },
    });

    return full ?? saved;
  }

  // Método para crear pago en Wompi
  private async createWompiPayment(cita: Cita) {
    const wompiPublicKey = this.configService.get<string>('WOMPI_PUBLIC_KEY');
    const integritySecret = this.configService.get<string>('WOMPI_INTEGRITY_SECRET');
    const redirectUrl = this.configService.get<string>('WOMPI_REDIRECT_URL', 'http://localhost:3000/');

    if (!wompiPublicKey) {
      throw new BadRequestException('WOMPI_PUBLIC_KEY no está configurada');
    }
    if (!integritySecret) {
      throw new BadRequestException('WOMPI_INTEGRITY_SECRET no está configurada');
    }

    const reference = `cita_${cita.id}_${Date.now()}`;
    const amountInCents = Math.round((cita.servicio.precio || 10000) * 100);
    const currency = 'COP';

    // Firma de integridad requerida por Wompi
    const signatureString = `${reference}${amountInCents}${currency}${integritySecret}`;
    const integrity = require('crypto').createHash('sha256').update(signatureString).digest('hex');

    const paymentLink = `https://checkout.wompi.co/p/?public-key=${wompiPublicKey}&reference=${reference}&amount-in-cents=${amountInCents}&currency=${currency}&redirect-url=${encodeURIComponent(redirectUrl)}&signature:integrity=${integrity}`;

    return { paymentLink, reference };
  }

  // Método para verificar estado de pago en Wompi
  async verifyWompiPayment(paymentId: string): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({ where: { id: paymentId }, relations: { appointment: true } });
    if (!payment) throw new NotFoundException('Pago no encontrado');
    if (payment.method !== PaymentMethod.WOMPI) throw new BadRequestException('Este pago no es de tipo Wompi');

    const wompiBaseUrl = this.configService.get<string>('WOMPI_BASE_URL', 'https://sandbox.wompi.co/v1');
    const wompiPrivateKey = this.configService.get<string>('WOMPI_PRIVATE_KEY');

    console.log('[WOMPI] Private key presente:', !!wompiPrivateKey);
    console.log('[WOMPI] Referencia:', payment.wompiReference);

    if (!wompiPrivateKey || !payment.wompiReference) {
      throw new BadRequestException('No se puede verificar el pago (falta configuración o referencia)');
    }

    try {
      const url = `${wompiBaseUrl}/transactions?reference=${payment.wompiReference}`;
      console.log('[WOMPI] Consultando URL:', url);

      const response = await fetch(url, {
        headers: { 
          'Authorization': `Basic ${Buffer.from(wompiPrivateKey + ':').toString('base64')}`,
        },
      });

      const data = await response.json();
      console.log('[WOMPI] Respuesta completa:', JSON.stringify(data));

      if (data.data && data.data.length > 0) {
        const transaction = data.data[0];
        payment.wompiTransactionId = transaction.id;

        if (transaction.status === 'APPROVED') {
          payment.status = PaymentStatus.PAID;
          const { tokenCode, tokenExpiresAt } = await this.buildToken();
          payment.tokenCode = tokenCode;
          payment.tokenExpiresAt = tokenExpiresAt;
        } else if (transaction.status === 'DECLINED' || transaction.status === 'VOIDED') {
          payment.status = PaymentStatus.FAILED;
        }
      } else {
        console.log('[WOMPI] No se encontraron transacciones para esta referencia');
      }

      return await this.paymentRepo.save(payment);
    } catch (error) {
      console.error('[WOMPI] Error al verificar:', error);
      throw new BadRequestException('Error al verificar el pago en Wompi');
    }
  }

  async validateToken(tokenCode: string): Promise<{
    valid: true;
    appointmentId: number;
  }> {
    // 1. Intentar buscar en la tabla de pagos (tokenCode)
    const payment = await this.paymentRepo.findOne({
      where: { tokenCode },
    });

    if (payment) {
      if (payment.tokenUsed) {
        throw new ConflictException('Token ya fue usado');
      }

      if (!payment.tokenExpiresAt || payment.tokenExpiresAt.getTime() <= Date.now()) {
        throw new GoneException('Token expirado');
      }

      payment.tokenUsed = true;
      await this.paymentRepo.save(payment);

      return { valid: true, appointmentId: payment.appointmentId };
    }

    // 2. Si no se encuentra en pagos, buscar en la tabla de citas (codigoEntrega)
    const cita = await this.citaRepo.findOne({
      where: { codigoEntrega: tokenCode },
    });

    if (!cita) {
      throw new NotFoundException('Token no encontrado');
    }

    // Si la cita tiene un pago asociado, lo marcamos como usado para permitir finalizar el servicio
    const associatedPayment = await this.paymentRepo.findOneBy({ appointmentId: cita.id });
    if (associatedPayment) {
      associatedPayment.tokenUsed = true;
      await this.paymentRepo.save(associatedPayment);
    }

    return { valid: true, appointmentId: cita.id };
  }

  async getTokenInfoForUser(userId: number, appointmentId: number): Promise<{
    payment: null | {
      tokenCode: string | null;
      tokenUsed: boolean;
      tokenExpiresAt: Date | null;
    };
  }> {
    const cita = await this.citaRepo.findOne({
      where: { id: appointmentId },
      relations: { usuario: true },
    });

    if (!cita) {
      throw new NotFoundException('Cita no encontrada');
    }

    if (cita.usuario?.id !== userId) {
      throw new ForbiddenException('No autorizado');
    }

    const payment = await this.paymentRepo.findOne({
      where: { appointmentId },
      select: { tokenCode: true, tokenUsed: true, tokenExpiresAt: true },
    });

    if (!payment) return { payment: null };

    return {
      payment: {
        tokenCode: payment.tokenCode,
        tokenUsed: payment.tokenUsed,
        tokenExpiresAt: payment.tokenExpiresAt,
      },
    };
  }

  private async buildToken(): Promise<{
    tokenCode: string;
    tokenExpiresAt: Date;
  }> {
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const tokenCode = randomInt(0, 1000000).toString().padStart(6, '0');
      const exists = await this.paymentRepo.exist({ where: { tokenCode } });
      if (!exists) return { tokenCode, tokenExpiresAt };
    }

    throw new ConflictException('No fue posible generar un token único');
  }
}
