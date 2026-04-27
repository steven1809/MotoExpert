import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Servicio } from './entities/servicio.entity';
import { Repository } from 'typeorm';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';

@Injectable()
export class ServiciosService {
  constructor(
    @InjectRepository(Servicio)
    private repo: Repository<Servicio>,
  ) {}

  findAll() {
    return this.repo.find();
  }

  findOne(id: number) {
    return this.repo.findOneBy({ id });
  }

  create(data: CreateServicioDto) {
    const newService = this.repo.create(data);
    return this.repo.save(newService);
  }

  async update(id: number, data: UpdateServicioDto) {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  delete(id: number) {
    return this.repo.delete(id);
  }
}