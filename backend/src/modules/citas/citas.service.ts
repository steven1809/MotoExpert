import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cita } from './entities/cita.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Vehiculo } from '../vehiculos/entities/vehiculo.entity';
import { Servicio } from '../servicios/entities/servicio.entity';
import { Empleado } from '../empleados/entities/empleado.entity';
import { CreateCitaDto } from './dto/create-cita.dto';

@Injectable()
export class CitasService {
  constructor(
    @InjectRepository(Cita)
    private readonly repo: Repository<Cita>,

    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,

    @InjectRepository(Vehiculo)
    private readonly vehiculoRepo: Repository<Vehiculo>,

    @InjectRepository(Servicio)
    private readonly servicioRepo: Repository<Servicio>,

    @InjectRepository(Empleado)
    private readonly empleadoRepo: Repository<Empleado>,
  ) {}

  async create(dto: CreateCitaDto) {
    const usuario = await this.usuarioRepo.findOne({ where: { id: dto.usuarioId } });
    const vehiculo = await this.vehiculoRepo.findOne({ where: { id: dto.vehiculoId } });
    const servicio = await this.servicioRepo.findOne({ where: { id: dto.servicioId } });
    const empleado = await this.empleadoRepo.findOne({ where: { id: dto.empleadoId } });

    if (!usuario || !vehiculo || !servicio || !empleado) {
      throw new BadRequestException('Datos inválidos: usuario, vehículo, servicio o empleado no encontrado');
    }

    const existe = await this.repo.findOne({
      where: {
        fecha: dto.fecha,
        hora_inicio: dto.hora_inicio,
        empleado: { id: dto.empleadoId },
      },
    });

    if (existe) {
      throw new BadRequestException('El empleado ya tiene una cita en ese horario');
    }

    const cita = this.repo.create({
      fecha: dto.fecha,
      hora_inicio: dto.hora_inicio,
      hora_fin: dto.hora_fin,
      usuario,
      vehiculo,
      servicio,
      empleado,
    });

    return this.repo.save(cita);
  }

  findAll() {
    return this.repo.find();
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  remove(id: number) {
    return this.repo.delete(id);
  }
}
