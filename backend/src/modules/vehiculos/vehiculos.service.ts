import { Injectable, NotFoundException } from '@nestjs/common';
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
    const where: any = { estado: 'ACTIVO' };
    if (userId) {
      where.usuario = { id: userId };
    }
    return this.repo.find({
      where,
      relations: ['usuario'],
    });
  }

  async findOne(id: number) {
    return this.repo.findOne({
      where: { id, estado: 'ACTIVO' },
      relations: ['usuario', 'citas'],
    });
  }

  async update(id: number, updateData: any) {
    await this.repo.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number) {
    const vehiculo = await this.repo.findOne({
      where: { id },
      relations: ['citas'],
    });

    if (!vehiculo) {
      throw new NotFoundException(`Vehículo con ID ${id} no encontrado`);
    }

    if (vehiculo.citas && vehiculo.citas.length > 0) {
      // Si tiene citas, hacemos borrado lógico para mantener la integridad referencial
      vehiculo.estado = 'INACTIVO';
      await this.repo.save(vehiculo);
      return { message: 'Vehículo marcado como inactivo debido a citas asociadas' };
    }

    // Si no tiene citas, podemos eliminarlo físicamente
    await this.repo.delete(id);
    return { message: 'Vehículo eliminado correctamente' };
  }
}
