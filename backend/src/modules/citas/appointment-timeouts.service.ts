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
    const now = new Date();

    const activeStates = ['PENDIENTE', 'EN PROCESO', 'pendiente', 'en_proceso'];

    const overdueWithExpectedEnd = await this.citasRepo.find({
      where: {
        estado: In(activeStates),
        expected_end_time: LessThan(now),
      },
    });

    const missingExpectedEnd = await this.citasRepo.find({
      where: {
        estado: In(activeStates),
        expected_end_time: IsNull(),
      },
    });

    const overdueComputed: Cita[] = [];
    for (const cita of missingExpectedEnd) {
      const durationMinutes =
        (cita.servicio?.duration_minutes ?? cita.servicio?.duracion ?? null) &&
        Number(cita.servicio?.duration_minutes ?? cita.servicio?.duracion)
          ? Number(cita.servicio?.duration_minutes ?? cita.servicio?.duracion)
          : 60;

      const start = new Date(`${cita.fecha}T${cita.hora_inicio}`);
      if (!Number.isFinite(start.getTime())) continue;

      const expectedEnd = new Date(start.getTime() + durationMinutes * 60_000);
      cita.expected_end_time = expectedEnd;
      cita.hora_fin = expectedEnd.toTimeString().slice(0, 8);
      await this.citasRepo.save(cita);

      if (expectedEnd < now) {
        overdueComputed.push(cita);
      }
    }

    const overdue = [...overdueWithExpectedEnd, ...overdueComputed];
    if (!overdue.length) return;

    for (const cita of overdue) {
      if (!cita.expected_end_time) continue;
      if (!cita.usuario?.id) continue;

      cita.estado = 'tiempo_excedido';
      await this.citasRepo.save(cita);

      const minutesOverdue = Math.max(
        0,
        Math.floor((now.getTime() - cita.expected_end_time.getTime()) / 60_000),
      );

      const payload: AppointmentTimeoutAlertPayload = {
        appointmentId: cita.id,
        clientName: cita.usuario?.nombre || '—',
        vehiclePlate: cita.vehiculo?.placa || '—',
        serviceName: cita.servicio?.nombre || '—',
        expectedEndTime: cita.expected_end_time.toISOString(),
        minutesOverdue,
      };

      this.gateway.emitAppointmentOverdue(cita.usuario.id, payload);
    }
  }
}
