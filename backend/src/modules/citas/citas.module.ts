import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cita } from './entities/cita.entity';
import { CitasService } from './citas.service';
import { CitasController } from './citas.controller';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Vehiculo } from '../vehiculos/entities/vehiculo.entity';
import { Servicio } from '../servicios/entities/servicio.entity';
import { Empleado } from '../empleados/entities/empleado.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Cita,
      Usuario,
      Vehiculo,
      Servicio,
      Empleado,
    ]),
  ],
  controllers: [CitasController],
  providers: [CitasService],
})
export class CitasModule {}
