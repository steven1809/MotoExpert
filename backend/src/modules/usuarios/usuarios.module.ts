import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './entities/usuario.entity';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { EmpleadosModule } from '../empleados/empleados.module';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario]), EmpleadosModule],
  exports: [TypeOrmModule, UsuariosService],
  providers: [UsuariosService],
  controllers: [UsuariosController],
})
export class UsuariosModule {}
