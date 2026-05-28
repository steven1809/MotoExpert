import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, LessThan, Repository } from 'typeorm';
import { Cita } from './entities/cita.entity';
import {
  AppointmentTimeoutsGateway,
  AppointmentTimeoutAlertPayload,
} from './appointment-timeouts.gateway';

@Injectable()
export class AppointmentTimeoutsService {
  constructor(
    @InjectRepository(Cita)
    private readonly citasRepo: Repository<Cita>,
    private readonly gateway: AppointmentTimeoutsGateway,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkOverdueAppointments() {
    // Lógica automática desactivada por requerimiento:
    // Las citas solo se marcan como atrasadas (tiempo_excedido) manualmente por el administrador.
    return;
  }
}
