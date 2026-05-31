import { JwtService } from '@nestjs/jwt';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ServiceStage } from './entities/service-stage.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cita } from '../citas/entities/cita.entity';

type JwtPayload = {
  sub?: number;
  role?: string;
  rol?: string;
};

export type ServiceTrackingNotificationPayload = {
  appointmentId: number;
  message: string;
  title?: string;
  type?: string;
};

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ServiceStagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(Cita)
    private readonly citaRepo: Repository<Cita>,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        (typeof client.handshake.query?.token === 'string'
          ? client.handshake.query.token
          : null);

      if (!token) {
        client.disconnect(true);
        return;
      }

      const payload = (await this.jwtService.verifyAsync(token)) as JwtPayload;
      const userId = payload.sub;
      const role = (payload.role || payload.rol || '').toLowerCase();

      if (!userId) {
        client.disconnect(true);
        return;
      }

      await client.join(`user:${userId}`);
      if (role) {
        await client.join(`role:${role}`);
        if (role === 'trabajador' || role === 'employee') {
          await client.join('role:empleado');
        }
      }
      client.data.userId = userId;
      client.data.role = role;
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect() {}

  @SubscribeMessage('join-appointment')
  async handleJoinAppointment(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: {
      appointmentId?: number | string;
      citaId?: number | string;
    },
  ) {
    const raw = body?.appointmentId ?? body?.citaId;
    const appointmentId = typeof raw === 'string' ? Number(raw) : raw;
    if (!Number.isFinite(appointmentId)) return;

    const userId = client.data?.userId as number | undefined;
    const role = String(client.data?.role || '').toLowerCase();
    if (!userId) return;

    if (role === 'admin') {
      await client.join(`appointment-${appointmentId}`);
      client.emit('joined-appointment', { appointmentId });
      return;
    }

    const cita = await this.citaRepo.findOne({
      where: { id: appointmentId },
      relations: ['usuario', 'empleado'],
    });
    if (!cita) return;

    const isOwner = cita.usuario?.id === userId;
    const isAssignedEmployee =
      (role === 'empleado' || role === 'trabajador') &&
      cita.empleado?.usuarioId === userId;

    if (!isOwner && !isAssignedEmployee) return;

    await client.join(`appointment-${appointmentId}`);
    client.emit('joined-appointment', { appointmentId });
  }

  emitStageUpdated(citaId: number, clienteUserId: number, stage: ServiceStage) {
    const payload = { citaId, stage };
    this.server.to(`user:${clienteUserId}`).emit('service_stage_updated', payload);
    this.server.to('role:empleado').emit('service_stage_updated', payload);
  }

  emitServiceUpdated(appointmentId: number, payload: any) {
    this.server.to(`appointment-${appointmentId}`).emit('service-updated', payload);
  }

  emitServiceTrackingNotification(
    clienteUserId: number,
    payload: ServiceTrackingNotificationPayload,
  ) {
    this.server
      .to(`user:${clienteUserId}`)
      .emit('service_tracking_notification', payload);
  }
}
