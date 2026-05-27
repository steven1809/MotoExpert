import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehiculo } from './entities/vehiculo.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';

@Injectable()
export class VehiculosService {
  constructor(
    @InjectRepository(Vehiculo)
    private readonly repo: Repository<Vehiculo>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
  ) {}

  async create(dto: CreateVehiculoDto) {
    const usuario = await this.usuarioRepo.findOne({
      where: { id: dto.usuarioId },
    });

    if (!usuario) {
      throw new NotFoundException(
        `Usuario con ID ${dto.usuarioId} no encontrado`,
      );
    }

    const vehiculo = this.repo.create({
      placa: dto.placa,
      marca: dto.marca,
      modelo: dto.modelo,
      tipo: dto.tipo,
      anio: dto.anio,
      color: dto.color,
      imagen: dto.imagen,
      usuario,
    });

    return this.repo.save(vehiculo);
  }

  async findByPlaca(placa: string) {
    return this.repo.findOne({
      where: { placa },
      relations: ['usuario'],
    });
  }

  async findAll(userId?: number) {
    const where = userId ? { usuario: { id: userId } } : {};

    const result = await this.repo.find({
      where,
      relations: ['usuario'],
    });

    console.log(
      'VEHICULOS:',
      JSON.stringify(result.map((v) => ({ id: v.id, imagen: v.imagen }))),
    );

    return result;
  }

  async findOne(id: number) {
    return await this.repo.findOne({
      where: { id },
      relations: ['usuario'],
    });
  }

  async update(id: number, updateData: any) {
    await this.repo.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number) {
    console.log(`[VehiculosService] Intentando eliminar vehículo con ID: ${id}`);
    
    try {
      const vehiculo = await this.repo.findOne({
        where: { id },
        relations: ['citas'],
      });

      if (!vehiculo) {
        console.warn(`[VehiculosService] Intento de eliminar vehículo inexistente (ID: ${id})`);
        throw new NotFoundException(`El vehículo con ID ${id} no existe en la base de datos.`);
      }

      // Al tener ON DELETE CASCADE en la entidad Cita, TypeORM/Postgres
      // se encargará de eliminar las citas asociadas automáticamente.
      const result = await this.repo.delete(id);
      
      if (result.affected === 0) {
        throw new InternalServerErrorException('No se pudo eliminar el vehículo de la base de datos.');
      }

      console.log(`[VehiculosService] Vehículo ${id} eliminado exitosamente.`);
      return { 
        success: true, 
        message: 'Vehículo y sus relaciones eliminados correctamente',
        id 
      };
    } catch (error) {
      console.error(`[VehiculosService] Error crítico al eliminar vehículo ${id}:`, error);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(`Error al procesar la eliminación: ${error.message}`);
    }
  }
}