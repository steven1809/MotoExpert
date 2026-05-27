import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { EmpleadosService } from '../empleados/empleados.service';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,
    private readonly empleadosService: EmpleadosService,
  ) {}

  async findAll(): Promise<Usuario[]> {
    return this.usuariosRepository.find();
  }

  async findEmployees() {
    return this.usuariosRepository.find({
      where: [
        { role: 'empleado' },
        { role: 'EMPLEADO' }
      ],
      select: ['id', 'nombre', 'telefono', 'picture']
    });
  }

  async findByEmail(email: string) {
    return this.usuariosRepository.findOne({
      where: { email },
    });
  }

  async findOne(id: number): Promise<Usuario> {
    const usuario = await this.usuariosRepository.findOne({ where: { id } });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return usuario;
  }

  async update(id: number, updateData: any) {
    const user = await this.usuariosRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // No permitir cambiar el password por aquí por seguridad
    const { password, ...rest } = updateData;

    const oldRole = user.role || 'cliente';
    const newRole = (rest.role || '').toLowerCase();
    
    // Forzar minúsculas en el rol si se está actualizando
    if (rest.role) {
      rest.role = newRole;
    }

    Object.assign(user, rest);
    const updatedUser = await this.usuariosRepository.save(user);

    // Lógica para sincronizar con la tabla de empleados
    const oldRoleLower = oldRole.toLowerCase();

    if (newRole === 'empleado' && oldRoleLower !== 'empleado') {
      try {
        const existingEmpleado = await this.empleadosService.findByUsuarioId(id);
        if (!existingEmpleado) {
          console.log(`[UsuariosService] Creating employee record for user ${id}`);
          await this.empleadosService.create({
            usuarioId: id,
            documentNumber: updatedUser.documento || undefined,
            cargo: 'Mecánico',
            especialidad: 'Mecánica General',
            estado: 'activo',
          });
        }
      } catch (error) {
        console.error(`[UsuariosService] Error creating employee record: ${error.message}`);
        // No relanzamos el error para no romper la actualización del rol del usuario,
        // pero el log nos dirá si hubo un problema de unicidad u otro.
      }
    } else if (oldRoleLower === 'empleado' && newRole !== '' && newRole !== 'empleado') {
      try {
        const existingEmpleado = await this.empleadosService.findByUsuarioId(id);
        if (existingEmpleado) {
          console.log(`[UsuariosService] Removing employee record for user ${id}`);
          await this.empleadosService.delete(existingEmpleado.id);
        }
      } catch (error) {
        console.error(`[UsuariosService] Error removing employee record: ${error.message}`);
      }
    }

    const { password: _p, ...result } = updatedUser;
    return result;
  }
}