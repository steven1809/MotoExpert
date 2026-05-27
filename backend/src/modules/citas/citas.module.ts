import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cita } from './entities/cita.entity';
import { CitasService } from './citas.service';
import { CitasController } from './citas.controller';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Vehiculo } from '../vehiculos/entities/vehiculo.entity';
import { Servicio } from '../servicios/entities/servicio.entity';
import { Empleado } from '../empleados/entities/empleado.entity';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { JwtModule } from '@nestjs/jwt';
import { AppointmentTimeoutsGateway } from './appointment-timeouts.gateway';
import { AppointmentTimeoutsService } from './appointment-timeouts.service';
import { AppointmentChat } from './entities/appointment-chat.entity';
import { AppointmentChatsService } from './appointment-chats.service';
import { AppointmentChatsGateway } from './appointment-chats.gateway';
import { AppointmentResolution } from './entities/appointment-resolution.entity';
import { AppointmentResolutionsService } from './appointment-resolutions.service';
import { Payment } from '../pagos/entities/payment.entity';
import { OtpModule } from '../otp/otp.module';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Cita,
      AppointmentChat,
      AppointmentResolution,
      Usuario,
      Vehiculo,
      Servicio,
      Empleado,
      Payment,
    ]),
    NotificacionesModule,
    OtpModule,
    ActivityModule,
    JwtModule.register({
      secret: 'clave_secreta',
    }),
  ],
  controllers: [CitasController],
  providers: [
    CitasService,
    AppointmentTimeoutsGateway,
    AppointmentTimeoutsService,
    AppointmentChatsService,
    AppointmentChatsGateway,
    AppointmentResolutionsService,
  ],
})
export class CitasModule {}
