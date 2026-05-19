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
import { AppointmentChatsService } from './appointment-chats.service';
import { AppointmentResolutionsService } from './appointment-resolutions.service';
import { AppointmentTimeoutsGateway } from './appointment-timeouts.gateway';

type JwtPayload = {
  sub?: number;
  role?: string;
  rol?: string;
};

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AppointmentChatsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatsService: AppointmentChatsService,
    private readonly resolutionsService: AppointmentResolutionsService,
    private readonly timeoutsGateway: AppointmentTimeoutsGateway,
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

      const payload = await this.jwtService.verifyAsync(token);
      const userId = payload.sub;
      const role = (payload.role || payload.rol || '').toLowerCase();

      if (!userId) {
        client.disconnect(true);
        return;
      }

      client.data.userId = userId;
      client.data.role = role;
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect() {}

  @SubscribeMessage('join_chat')
  async joinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { appointmentId: number },
  ) {
    const userId = client.data.userId as number | undefined;
    const role = client.data.role as string | undefined;
    const appointmentId = Number(body?.appointmentId);
    if (!userId || !appointmentId) return;

    await this.chatsService.assertCanAccess(appointmentId, userId, role || '');
    const roomId = `chat_appointment_${appointmentId}`;
    await client.join(roomId);
    return { ok: true, roomId };
  }

  @SubscribeMessage('send_message')
  async sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { appointmentId: number; message: string },
  ) {
    const userId = client.data.userId as number | undefined;
    const role = client.data.role as string | undefined;
    const appointmentId = Number(body?.appointmentId);
    const message = (body?.message || '').toString().trim();
    if (!userId || !appointmentId || !message) return;

    const cita = await this.chatsService.assertCanAccess(
      appointmentId,
      userId,
      role || '',
    );
    const senderRole =
      (role || '').toLowerCase() === 'admin' ||
      (role || '').toLowerCase() === 'empleado' ||
      (role || '').toLowerCase() === 'trabajador'
        ? 'STAFF'
        : 'CLIENT';

    const saved = await this.chatsService.createMessage({
      appointmentId,
      senderId: userId,
      senderRole,
      message,
    });

    const roomId = `chat_appointment_${appointmentId}`;
    const payload = {
      id: saved.id,
      appointmentId,
      senderId: saved.sender_id,
      senderRole: saved.sender_role,
      message: saved.message,
      createdAt: saved.created_at,
      serviceName: cita.servicio?.nombre || '—',
      vehiclePlate: cita.vehiculo?.placa || '—',
    };

    this.server.to(roomId).emit('new_message', payload);
    return { ok: true };
  }

  @SubscribeMessage('resolve_appointment')
  async resolveAppointment(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: {
      appointmentId: number;
      resolutionType: 'Completado' | 'Reprogramado';
    },
  ) {
    const userId = client.data.userId as number | undefined;
    const role = client.data.role as string | undefined;
    const appointmentId = Number(body?.appointmentId);
    const resolutionType = (body?.resolutionType || '').toString();
    if (!userId || !appointmentId || !resolutionType) return;

    const { cita, resolutionType: normalized } =
      await this.resolutionsService.resolveAppointment({
        appointmentId,
        resolvedBy: userId,
        role: role || '',
        resolutionType,
      });

    const roomId = `chat_appointment_${appointmentId}`;
    this.server.to(roomId).emit('appointment_resolved', { appointmentId });
    this.timeoutsGateway.emitAppointmentResolved(
      cita.usuario?.id,
      appointmentId,
    );
    return { ok: true, appointmentId, resolutionType: normalized };
  }
}
