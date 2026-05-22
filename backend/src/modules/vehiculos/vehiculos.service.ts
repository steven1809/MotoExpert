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

  findOne(id: number) {
    return this.repo.findOne({
      where: { id },
      relations: ['usuario'],
    });
  }

  async update(id: number, updateData: any) {
    await this.repo.update(id, updateData);
    return this.findOne(id);
  }

  remove(id: number) {
    return this.repo.delete(id);
  }
}