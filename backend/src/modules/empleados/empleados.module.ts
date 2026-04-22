import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Empleado } from './entities/empleado.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Empleado])],
  exports: [TypeOrmModule],
})
export class EmpleadosModule {}
