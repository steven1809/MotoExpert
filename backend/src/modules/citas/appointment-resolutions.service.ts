import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppointmentResolution } from './entities/appointment-resolution.entity';
import { Cita } from './entities/cita.entity';
import { AppointmentChatsService } from './appointment-chats.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { CitasService } from './citas.service';

@Injectable()
export class AppointmentResolutionsService {
  constructor(
    @InjectRepository(AppointmentResolution)
    private readonly resolutionsRepo: Repository<AppointmentResolution>,
    @InjectRepository(Cita)
    private readonly citasRepo: Repository<Cita>,
    private readonly chatsService: AppointmentChatsService,
    private readonly notificacionesService: NotificacionesService,
    private readonly citasService: CitasService,
  ) {}

  private isStaff(role: string) {
    const r = (role || '').toLowerCase();
    return r === 'admin' || r === 'empleado' || r === 'trabajador';
  }

  private normalizeResolutionType(type: string) {
    const t = (type || '').toLowerCase().trim();
    if (t === 'completado') return 'completado';
    if (t === 'reprogramado') return 'reprogramado';
    return null;
  }

  async resolveAppointment(params: {
    appointmentId: number;
    resolvedBy: number;
    role: string;
    resolutionType: string;
  }) {
    if (!this.isStaff(params.role)) {
      throw new ForbiddenException('Solo personal puede resolver citas');
    }

    const resolutionType = this.normalizeResolutionType(params.resolutionType);
    if (!resolutionType)
      throw new BadRequestException('Tipo de resolución inválido');

    const cita = await this.chatsService.assertCanAccess(
      params.appointmentId,
      params.resolvedBy,
      params.role,
    );

    if (resolutionType === 'completado') {
      await this.citasService.updateEstado(cita.id, 'FINALIZADO');
    } else {
      cita.estado = 'REPROGRAMADO';
      await this.citasRepo.save(cita);
    }

    await this.resolutionsRepo.save(
      this.resolutionsRepo.create({
        appointment_id: cita.id,
        resolved_by: params.resolvedBy,
        resolution_type: resolutionType,
      }),
    );

    await this.notificacionesService.create(
      cita.usuario,
      'appointment_resolved',
      'Appointment resolved',
      `Your appointment for ${cita.servicio?.nombre || 'service'} (${cita.vehiculo?.placa || 'vehicle'}) was marked as ${resolutionType}.`,
    );

    return { cita, resolutionType };
  }
}
