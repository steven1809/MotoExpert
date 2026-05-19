import { JwtService } from '@nestjs/jwt';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

type JwtPayload = {
  sub?: number;
  role?: string;
  rol?: string;
};

export type AppointmentTimeoutAlertPayload = {
  appointmentId: number;
  clientName: string;
  vehiclePlate: string;
  serviceName: string;
  expectedEndTime: string;
  minutesOverdue: number;
};

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AppointmentTimeoutsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly jwtService: JwtService) {}

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

      await client.join(`user:${userId}`);
      if (role) {
        await client.join(`role:${role}`);
        if (role === 'trabajador' || role === 'employee') {
          await client.join('role:empleado');
        }
      }
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect() {}

  emitAppointmentOverdue(
    userId: number,
    payload: AppointmentTimeoutAlertPayload,
  ) {
    this.server.to('role:admin').emit('appointment_overdue', payload);
    this.server.to('role:empleado').emit('appointment_overdue', payload);
    this.server.to(`user:${userId}`).emit('appointment_overdue', payload);

    this.server.to('role:admin').emit('appointment_timeout', payload);
    this.server.to('role:empleado').emit('appointment_timeout', payload);
    this.server.to(`user:${userId}`).emit('appointment_timeout', payload);
  }

  emitAppointmentResolved(userId: number, appointmentId: number) {
    const payload = { appointmentId };
    this.server.to('role:admin').emit('appointment_resolved', payload);
    this.server.to('role:empleado').emit('appointment_resolved', payload);
    this.server.to(`user:${userId}`).emit('appointment_resolved', payload);
  }
}
