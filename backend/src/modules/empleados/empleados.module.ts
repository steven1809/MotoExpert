import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Empleado } from './entities/empleado.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { EmpleadosService } from './empleados.service';
import { EmpleadosController } from './empleados.controller';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Empleado, Usuario]),
    ActivityModule,
  ],
  controllers: [EmpleadosController],
  providers: [EmpleadosService],
  exports: [EmpleadosService],
})
export class EmpleadosModule {}
