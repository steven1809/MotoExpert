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

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Cita)
    private readonly citaRepo: Repository<Cita>,
  ) {}

  async generateToken(
    appointmentId: number,
    method: PaymentMethod,
    mockApproved?: boolean,
  ): Promise<Payment> {
    const cita = await this.citaRepo.findOneBy({ id: appointmentId });
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
    } else if (method === PaymentMethod.CARD || method === PaymentMethod.PSE) {
      if (typeof mockApproved !== 'boolean') {
        throw new BadRequestException(
          'mockApproved es requerido para card/pse',
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
