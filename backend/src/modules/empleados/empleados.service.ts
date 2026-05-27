import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Empleado } from './entities/empleado.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class EmpleadosService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Empleado)
    private readonly repo: Repository<Empleado>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    private readonly activityService: ActivityService,
  ) {}

  async onApplicationBootstrap() {
    console.log('[EmpleadosService] Running initial synchronization...');
    try {
      // Sincronización proactiva secuencial: Buscar usuarios con rol 'empleado'
      const usuariosEmpleados = await this.usuarioRepo.find({
        where: { role: ILike('empleado') }
      });

      for (const usuario of usuariosEmpleados) {
        const exists = await this.repo.findOne({ where: { usuarioId: usuario.id } });
        if (!exists) {
          console.log(`[EmpleadosService] Sync: Creating missing employee record for user ${usuario.id}`);
          const newEmpleado = this.repo.create({
            usuarioId: usuario.id,
            documentNumber: usuario.documento || undefined,
            cargo: 'Mecánico',
            especialidad: 'Mecánica General',
            estado: 'activo',
          });
          await this.repo.save(newEmpleado);
        }
      }
      console.log('[EmpleadosService] Synchronization completed.');
    } catch (error) {
      console.error('[EmpleadosService] Sync error:', error.message);
    }
  }

  async findAll() {
    return this.repo.find({ 
      relations: ['usuario', 'citas'],
      order: { id: 'DESC' }
    });
  }

  async findByUsuarioId(usuarioId: number) {
    return await this.repo.findOne({
      where: { usuarioId },
      relations: ['usuario', 'citas'],
    });
  }

  async findOne(id: number) {
    return await this.repo.findOne({
      where: { id },
      relations: ['usuario', 'citas'],
    });
  }

  async create(data: CreateEmpleadoDto) {
    const newEmpleado = this.repo.create(data);
    return await this.repo.save(newEmpleado);
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

    return await this.repo.findOne({ 
      where: { id }, 
      relations: ['usuario'] 
    });
  }

  async delete(id: number) {
    return await this.repo.delete(id);
  }
}
