import { Injectable } from '@nestjs/common';
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
  ) {}

  async create(dto: CreateVehiculoDto) {
    const vehiculo = this.repo.create({
      placa: dto.placa,
      marca: dto.marca,
      modelo: dto.modelo,
      tipo: dto.tipo,
      anio: dto.anio,
      color: dto.color,
      usuario: { id: dto.usuarioId } as Usuario,
    });

    return this.repo.save(vehiculo);
  }

  findAll() {
    return this.repo.find({ relations: ['usuario'] });
  }

  findOne(id: number) {
    return this.repo.findOne({
      where: { id },
      relations: ['usuario'],
    });
  }

  remove(id: number) {
    return this.repo.delete(id);
  }
}
