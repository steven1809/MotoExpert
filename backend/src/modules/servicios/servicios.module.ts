import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Servicio } from './entities/servicio.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Servicio])],
  exports: [TypeOrmModule],
})
export class ServiciosModule {}
