import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppointmentChat } from './entities/appointment-chat.entity';
import { Cita } from './entities/cita.entity';

@Injectable()
export class AppointmentChatsService {
  constructor(
    @InjectRepository(AppointmentChat)
    private readonly chatsRepo: Repository<AppointmentChat>,
    @InjectRepository(Cita)
    private readonly citasRepo: Repository<Cita>,
  ) {}

  private normalizeRole(role: string) {
    return (role || '').toLowerCase();
  }

  async assertCanAccess(appointmentId: number, userId: number, role: string) {
    const cita = await this.citasRepo.findOne({
      where: { id: appointmentId },
      relations: [
        'usuario',
        'vehiculo',
        'servicio',
        'empleado',
        'empleado.usuario',
      ],
    });

    if (!cita) throw new NotFoundException('Cita no encontrada');

    const normalized = this.normalizeRole(role);
    if (normalized === 'admin') return cita;
    if (normalized === 'empleado' || normalized === 'trabajador') {
      const empleadoUsuarioId = cita.empleado?.usuario?.id;
      if (empleadoUsuarioId && empleadoUsuarioId === userId) return cita;
      throw new ForbiddenException('No tienes permiso para este chat');
    }

    if (cita.usuario?.id === userId) return cita;
    throw new ForbiddenException('No tienes permiso para este chat');
  }

  async getHistory(appointmentId: number) {
    return this.chatsRepo.find({
      where: { appointment_id: appointmentId },
      order: { created_at: 'ASC' },
    });
  }

  async createMessage(params: {
    appointmentId: number;
    senderId: number;
    senderRole: string;
    message: string;
  }) {
    const chat = this.chatsRepo.create({
      appointment_id: params.appointmentId,
      sender_id: params.senderId,
      sender_role: params.senderRole,
      message: params.message,
    });
    return this.chatsRepo.save(chat);
  }
}
