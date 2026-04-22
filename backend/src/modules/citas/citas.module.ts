import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cita } from './entities/cita.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cita])],
  exports: [TypeOrmModule],
})
export class CitasModule {}
