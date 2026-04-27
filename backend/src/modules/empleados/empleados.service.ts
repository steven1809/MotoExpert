import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empleado } from './entities/empleado.entity';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';

@Injectable()
export class EmpleadosService {
  constructor(
    @InjectRepository(Empleado)
    private readonly repo: Repository<Empleado>,
  ) {}

  findAll() {
    return this.repo.find();
  }

  findOne(id: number) {
    return this.repo.findOneBy({ id });
  }

  create(data: CreateEmpleadoDto) {
    const newEmpleado = this.repo.create(data);
    return this.repo.save(newEmpleado);
  }

  async update(id: number, data: UpdateEmpleadoDto) {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  delete(id: number) {
    return this.repo.delete(id);
  }
}
