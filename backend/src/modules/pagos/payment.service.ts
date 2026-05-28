import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomInt } from 'crypto';
import { Repository } from 'typeorm';
import { Cita } from '../citas/entities/cita.entity';
import { Payment } from './entities/payment.entity';
import { PaymentMethod } from './enums/payment-method.enum';
import { PaymentStatus } from './enums/payment-status.enum';
import { ActivityService } from '../activity/activity.service';

import { createHash } from 'crypto';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Cita)
    private readonly citaRepo: Repository<Cita>,
    private readonly activityService: ActivityService,
  ) {}

  async generateToken(
    appointmentId: number,
    method: PaymentMethod,
    mockApproved?: boolean,
  ): Promise<Payment> {
    const cita = await this.citaRepo.findOne({
      where: { id: appointmentId },
      relations: { usuario: true },
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
      payment.status = PaymentStatus.PENDING;
      const { tokenCode, tokenExpiresAt } = await this.buildToken();
      payment.tokenCode = tokenCode;
      payment.tokenExpiresAt = tokenExpiresAt;
    } else if (method === PaymentMethod.WOMPI) {
      if (typeof mockApproved !== 'boolean') {
        throw new BadRequestException(
          'mockApproved es requerido para wompi',
        );
      }

      payment.status = mockApproved ? PaymentStatus.PAID : PaymentStatus.FAILED;

      if (payment.status === PaymentStatus.PAID) {
        const { tokenCode, tokenExpiresAt } = await this.buildToken();
        payment.tokenCode = tokenCode;
        payment.tokenExpiresAt = tokenExpiresAt;
      }
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

  async validateToken(tokenCode: string): Promise<{
    valid: true;
    appointmentId: number;
  }> {
    const payment = await this.paymentRepo.findOne({
      where: { tokenCode },
      select: {
        id: true,
        appointmentId: true,
        tokenCode: true,
        tokenUsed: true,
        tokenExpiresAt: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Token no encontrado');
    }

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

  async initWompi(
    appointmentId: number,
  ): Promise<{
    publicKey: string;
    reference: string;
    integritySignature: string;
    amountCOP: number;
    redirectUrl: string;
  }> {
    const cita = await this.citaRepo.findOne({
      where: { id: appointmentId },
      relations: { servicio: true },
    });

    if (!cita) {
      throw new NotFoundException(
        'Cita no encontrada',
      );
    }

    if (!cita.servicio?.precio) {
      throw new BadRequestException(
        'El servicio no tiene precio definido',
      );
    }

    // PRECIO
    const amountCOP = Number(
      cita.servicio.precio,
    );

    // WOMPI USA CENTAVOS
    const amountInCents = Math.round(
      amountCOP * 100,
    );

    const currency = 'COP';

    // REFERENCIA ÚNICA
    const reference = `me-${appointmentId}-${Date.now()}`;

    // VARIABLES .ENV
    const integritySecret =
      process.env.WOMPI_INTEGRITY_SECRET?.trim() || '';

    const publicKey =
      process.env.WOMPI_PUBLIC_KEY?.trim() || '';

    // URL REDIRECT
    const redirectUrl = `${
      process.env.FRONTEND_URL ??
      'http://localhost:3002'
    }/appointments/payment-confirmation`;

    console.log(
      '[Wompi Debug] amountInCents:',
      amountInCents,
    );

    console.log(
      '[Wompi Debug] currency:',
      currency,
    );

    console.log(
      '[Wompi Debug] reference:',
      reference,
    );

    console.log(
      '[Wompi Debug] integritySecret:',
      integritySecret,
    );

    // ORDEN CORRECTO WOMPI:
    // amountInCents + currency + reference + integritySecret

    const raw = `${amountInCents}${currency}${reference}${integritySecret}`;

    console.log(
      '[Wompi] STRING A ENCRIPTAR:',
      raw,
    );

    const integritySignature = createHash('sha256')
      .update(raw, 'utf8')
      .digest('hex');

    console.log(
      '[Wompi] SIGNATURE:',
      integritySignature,
    );

    return {
      publicKey,
      reference,
      integritySignature,
      amountCOP,
      redirectUrl,
    };
  }


  async verifyWompi(
    transactionId: string,
  ): Promise<{ status: string; appointmentId: number | null }> {
    const wompiResponse = await fetch(
      `https://sandbox.wompi.co/v1/transactions/${transactionId}`,
      { headers: { Authorization: `Bearer ${process.env.WOMPI_PRIVATE_KEY}` } },
    );
    if (!wompiResponse.ok)
      throw new NotFoundException('Transacción no encontrada en Wompi');

    const wompiData = await wompiResponse.json();
    const transaction = wompiData?.data;
    const wompiStatus = transaction?.status;
    const reference = transaction?.reference as string | undefined;

    if (!reference)
      throw new BadRequestException('Referencia no encontrada en la transacción');

    const appointmentId = Number(reference.split('-')[1]);
    if (!appointmentId || isNaN(appointmentId))
      throw new BadRequestException(
        'No se pudo extraer el appointmentId de la referencia',
      );

    if (wompiStatus !== 'APPROVED') return { status: wompiStatus, appointmentId };

    const existing = await this.paymentRepo.findOneBy({ appointmentId });
    if (existing) return { status: wompiStatus, appointmentId };

    const cita = await this.citaRepo.findOneBy({ id: appointmentId });
    if (!cita) throw new NotFoundException('Cita no encontrada');

    const { tokenCode, tokenExpiresAt } = await this.buildToken();
    const payment = this.paymentRepo.create({
      appointmentId,
      appointment: cita,
      method: PaymentMethod.WOMPI,
      status: PaymentStatus.PAID,
      tokenCode,
      tokenExpiresAt,
      tokenUsed: false,
    });
    const saved = await this.paymentRepo.save(payment);

    try {
      await this.activityService.logActivity(
        'PAGO_COMPLETADO',
        `Pago Wompi aprobado para cita #${appointmentId}`,
        'pago',
        appointmentId.toString(),
        'sistema',
        'sistema',
      );
    } catch (error) {
      console.error('Error logging activity:', error);
    }

    return { status: 'APPROVED', appointmentId };
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
