import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empleado } from './entities/empleado.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class EmpleadosService {
  constructor(
    @InjectRepository(Empleado)
    private readonly repo: Repository<Empleado>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    private readonly activityService: ActivityService,
  ) {}

  async findAll() {
    // Sincronización proactiva: Buscar usuarios con rol 'empleado' que no tengan registro de empleado
    const usuariosEmpleados = await this.usuarioRepo
      .createQueryBuilder('usuario')
      .where('LOWER(usuario.role) = :role', { role: 'empleado' })
      .getMany();

    for (const usuario of usuariosEmpleados) {
      const exists = await this.repo.findOne({ where: { usuarioId: usuario.id } });
      if (!exists) {
        console.log(`[EmpleadosService] Sync: Creating missing employee record for user ${usuario.id}`);
        await this.create({
          usuarioId: usuario.id,
          documentNumber: usuario.documento || undefined,
          cargo: 'Mecánico',
          especialidad: 'Mecánica General',
          estado: 'activo',
        });
      }
    }

    return this.repo.find({ 
      relations: ['usuario', 'citas'],
      order: { id: 'DESC' }
    });
  }

  findByUsuarioId(usuarioId: number) {
    return this.repo.findOne({
      where: { usuarioId },
      relations: ['usuario', 'citas'],
    });
  }

  findOne(id: number) {
    return this.repo.findOne({
      where: { id },
      relations: ['usuario', 'citas'],
    });
  }

  create(data: CreateEmpleadoDto) {
    const newEmpleado = this.repo.create(data);
    return this.repo.save(newEmpleado);
  }

  async update(id: number, data: UpdateEmpleadoDto) {
    await this.repo.update(id, data);
    
    // Registrar actividad
    await this.activityService.logActivity(
      'EMPLEADO_ACTUALIZADO',
      `Cargo de empleado #${id} actualizado`,
      'empleado',
      id.toString(),
      'admin',
      'admin'
    );

    return this.repo.findOne({ 
      where: { id }, 
      relations: ['usuario'] 
    });
  }

  delete(id: number) {
    return this.repo.delete(id);
  }
}
