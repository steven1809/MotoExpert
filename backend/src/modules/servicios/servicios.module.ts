import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Servicio } from './entities/servicio.entity';
import { ServiciosService } from './servicios.service';
import { ServiciosController } from './servicios.controller';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [TypeOrmModule.forFeature([Servicio]), ActivityModule],
  controllers: [ServiciosController],
  providers: [ServiciosService],
})
export class ServiciosModule {}
