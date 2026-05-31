import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceStage } from './entities/service-stage.entity';
import { ServiceStagesService } from './service-stages.service';
import { ServiceStagesController } from './service-stages.controller';
import { AuthModule } from '../../auth/auth.module';
import { Cita } from '../citas/entities/cita.entity';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { ServiceStagesGateway } from './service-stages.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceStage, Cita]),
    AuthModule,
    NotificacionesModule,
  ],
  providers: [ServiceStagesService, ServiceStagesGateway],
  controllers: [ServiceStagesController],
  exports: [ServiceStagesService],
})
export class ServiceStagesModule {}
