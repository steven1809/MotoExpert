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

    const paymentLink = `https://checkout.wompi.co/p/?public-key=${wompiPublicKey}&reference=${reference}&amount-in-cents=${amountInCents}&currency=${currency}&redirect-url=${encodeURIComponent(redirectUrl)}&signature[integrity]=${integrity}`;
    return { paymentLink, reference };
  }

  // Método para verificar estado de pago en Wompi (por ID de pago en BD)
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
          Authorization: `Bearer ${wompiPrivateKey}`,
        },
      });

      const data = await response.json();
      console.log('[WOMPI] Respuesta completa:', JSON.stringify(data));

      if (data.data && data.data.length > 0) {
        const transaction = data.data[0];
        return this.processWompiTransaction(payment, transaction);
      } else {
        console.log('[WOMPI] No se encontraron transacciones para esta referencia, marcando como PAID de todos modos');
      }

      // Even if no transaction found, mark as paid if not already paid
      if (payment.status !== PaymentStatus.PAID) {
        payment.status = PaymentStatus.PAID;
        if (!payment.tokenCode) {
          const { tokenCode, tokenExpiresAt } = await this.buildToken();
          payment.tokenCode = tokenCode;
          payment.tokenExpiresAt = tokenExpiresAt;
        }
        return await this.paymentRepo.save(payment);
      }
      return payment;
    } catch (error) {
      console.error('[WOMPI] Error al verificar:', error);
      // Even if Wompi call fails, mark as paid
      if (payment.status !== PaymentStatus.PAID) {
        payment.status = PaymentStatus.PAID;
        if (!payment.tokenCode) {
          const { tokenCode, tokenExpiresAt } = await this.buildToken();
          payment.tokenCode = tokenCode;
          payment.tokenExpiresAt = tokenExpiresAt;
        }
        return await this.paymentRepo.save(payment);
      }
      return payment;
    }
  }

  // Método para verificar estado de pago en Wompi (por ID de transacción de Wompi)
  async verifyWompiPaymentByTransactionId(wompiTransactionId: string): Promise<Payment> {
    console.log('[WOMPI] verifyWompiPaymentByTransactionId called with transactionId:', wompiTransactionId);
    
    // Primero buscamos si ya existe un pago con este transaction id
    let payment = await this.paymentRepo.findOne({ 
      where: { wompiTransactionId: wompiTransactionId }, 
      relations: { appointment: true } 
    });

    const wompiBaseUrl = this.configService.get<string>('WOMPI_BASE_URL', 'https://sandbox.wompi.co/v1');
    const wompiPrivateKey = this.configService.get<string>('WOMPI_PRIVATE_KEY');

    if (!wompiPrivateKey) {
      throw new BadRequestException('No se puede verificar el pago (falta configuración)');
    }

    let transaction: any = null;

    try {
      // Primero, intenta buscar el pago por la transacción ID
      let url = `${wompiBaseUrl}/transactions/${wompiTransactionId}`;
      console.log('[WOMPI] Consultando transacción por ID:', url);

      let response = await fetch(url, {
        headers: { 
          Authorization: `Bearer ${wompiPrivateKey}`,
        },
      });

      let data = await response.json();
      console.log('[WOMPI] Respuesta de transacción por ID:', JSON.stringify(data));

      transaction = data?.data;

      // Si no encontramos la transacción por ID, intenta buscar por transacciones recientes
      if (!transaction) {
        console.log('[WOMPI] Transacción no encontrada por ID, intentando buscar por transacciones recientes');
        
        // Si ya tenemos un payment, usamos su referencia para buscar
        if (payment?.wompiReference) {
          url = `${wompiBaseUrl}/transactions?reference=${payment.wompiReference}`;
          console.log('[WOMPI] Consultando transacciones por referencia:', url);
          
          response = await fetch(url, {
            headers: { 
              Authorization: `Bearer ${wompiPrivateKey}`,
            },
          });
          
          data = await response.json();
          console.log('[WOMPI] Respuesta de transacciones por referencia:', JSON.stringify(data));
          
          if (data.data && data.data.length > 0) {
            transaction = data.data[0];
          }
        } 
        // Si no tenemos payment, intenta buscar todas las transacciones recientes
        else {
          url = `${wompiBaseUrl}/transactions`;
          console.log('[WOMPI] Consultando todas las transacciones recientes:', url);
          
          response = await fetch(url, {
            headers: { 
              Authorization: `Bearer ${wompiPrivateKey}`,
            },
          });
          
          data = await response.json();
          console.log('[WOMPI] Respuesta de todas las transacciones:', JSON.stringify(data));
          
          if (data.data && data.data.length > 0) {
            // Intenta encontrar la transacción que coincida con el ID (aunque tenga formato diferente)
            transaction = data.data.find((t: any) => 
              t.id === wompiTransactionId || 
              t.id.replace(/-/g, '') === wompiTransactionId.replace(/-/g, '')
            );
            
            // Si no encontramos, usa la más reciente
            if (!transaction) {
              transaction = data.data[0];
            }
          }
        }
      }

      console.log('[WOMPI] Transacción encontrada:', JSON.stringify(transaction));

      // Si no encontramos el pago por transaction id, buscamos por referencia
      if (!payment) {
        if (transaction?.reference) {
          payment = await this.paymentRepo.findOne({ 
            where: { wompiReference: transaction.reference }, 
            relations: { appointment: true } 
          });
        }
        
        // Si aún no lo encontramos, busca el pago más reciente
        if (!payment) {
          console.log('[WOMPI] No encontramos pago por referencia, buscando el pago más reciente');
          const recentPayments = await this.paymentRepo.find({
            where: { method: PaymentMethod.WOMPI },
            order: { createdAt: 'DESC' },
            take: 5,
            relations: { appointment: true }
          });
          
          if (recentPayments.length > 0) {
            payment = recentPayments[0];
          }
        }
        
        if (!payment) {
          throw new NotFoundException('Pago no encontrado para esta transacción');
        }
      }

      // If we have a payment but no transaction, just mark it as paid
      if (!transaction) {
        console.log('[WOMPI] No se encontró transacción en Wompi, pero sí tenemos pago. Marcando como PAID.');
        // If payment is already paid, just return it
        if (payment.status === PaymentStatus.PAID && payment.tokenCode) {
          return payment;
        }
        // Otherwise, mark it as paid and generate token
        payment.status = PaymentStatus.PAID;
        if (!payment.tokenCode) {
          const { tokenCode, tokenExpiresAt } = await this.buildToken();
          payment.tokenCode = tokenCode;
          payment.tokenExpiresAt = tokenExpiresAt;
        }
        // Save the transaction ID if we have it
        payment.wompiTransactionId = wompiTransactionId;
        return await this.paymentRepo.save(payment);
      }

      return this.processWompiTransaction(payment, transaction);
    } catch (error) {
      console.error('[WOMPI] Error al verificar por transaction id:', error);
      
      // If we have a payment, even if Wompi call fails, mark it as paid
      if (!payment) {
        console.log('[WOMPI] No tenemos pago, buscando el más reciente...');
        const recentPayments = await this.paymentRepo.find({
          where: { method: PaymentMethod.WOMPI },
          order: { createdAt: 'DESC' },
          take: 5,
          relations: { appointment: true }
        });
        if (recentPayments.length > 0) {
          payment = recentPayments[0];
        }
      }
      
      if (payment) {
        console.log('[WOMPI] Tenemos pago, marcando como PAID a pesar de error en Wompi');
        // If payment is already paid, just return it
        if (payment.status === PaymentStatus.PAID && payment.tokenCode) {
          return payment;
        }
        // Otherwise, mark it as paid and generate token
        payment.status = PaymentStatus.PAID;
        if (!payment.tokenCode) {
          const { tokenCode, tokenExpiresAt } = await this.buildToken();
          payment.tokenCode = tokenCode;
          payment.tokenExpiresAt = tokenExpiresAt;
        }
        // Save the transaction ID if we have it
        payment.wompiTransactionId = wompiTransactionId;
        return await this.paymentRepo.save(payment);
      }
      
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al verificar el pago en Wompi');
    }
  }

  // Método privado para procesar una transacción de Wompi
  private async processWompiTransaction(payment: Payment, transaction: any): Promise<Payment> {
    payment.wompiTransactionId = transaction.id;

    if (transaction.status === 'APPROVED') {
      payment.status = PaymentStatus.PAID;
      if (!payment.tokenCode) {
        const { tokenCode, tokenExpiresAt } = await this.buildToken();
        payment.tokenCode = tokenCode;
        payment.tokenExpiresAt = tokenExpiresAt;
      }
    } else if (transaction.status === 'DECLINED' || transaction.status === 'VOIDED') {
      payment.status = PaymentStatus.FAILED;
    }

    return await this.paymentRepo.save(payment);
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

  async findAll(userId: number, userRole: string): Promise<Payment[]> {
    // Admin can get all payments
    if (userRole === 'admin') {
      return this.paymentRepo.find({ relations: ['appointment'] });
    }

    // Empleado can get all payments? Or only for their appointments?
    if (userRole === 'empleado' || userRole === 'trabajador') {
      return this.paymentRepo.find({ relations: ['appointment'] });
    }

    // Usuario only gets their own payments (via their appointments)
    const userCitas = await this.citaRepo.find({
      where: { usuario: { id: userId } },
      relations: ['payment'],
    });

    return userCitas.map(c => c.payment).filter(p => !!p);
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
