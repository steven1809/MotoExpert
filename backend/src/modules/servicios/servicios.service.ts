import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Servicio } from './entities/servicio.entity';
import { Repository } from 'typeorm';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';

@Injectable()
export class ServiciosService implements OnModuleInit {
  constructor(
    @InjectRepository(Servicio)
    private repo: Repository<Servicio>,
  ) {}

  async onModuleInit() {
    const servicios = await this.repo.find();
    const defaults: Record<string, number> = {
      'lavado basico': 45,
      'lavado especial': 60,
      polichado: 90,
      'limpieza de cadena': 30,
    };

    const normalize = (t: string) =>
      (t || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

    const updates: Promise<unknown>[] = [];
    for (const s of servicios) {
      const key = normalize(s.nombre);
      const minutes = defaults[key];
      if (!minutes) continue;
      if (!s.duration_minutes || s.duration_minutes <= 0) {
        updates.push(
          this.repo.update(
            { id: s.id },
            {
              duration_minutes: minutes,
              duracion: s.duracion && s.duracion > 0 ? s.duracion : minutes,
            },
          ),
        );
      }
    }

    if (updates.length) {
      await Promise.all(updates);
    }
  }

  findAll() {
    return this.repo.find();
  }

  findOne(id: number) {
    return this.repo.findOneBy({ id });
  }

  create(data: CreateServicioDto) {
    const newService = this.repo.create({
      ...data,
      duration_minutes: Number(data.duracion),
    });
    return this.repo.save(newService);
  }

  async update(id: number, data: UpdateServicioDto) {
    const patch: Partial<Servicio> = {
      ...data,
    };
    if (typeof data.duracion === 'number') {
      patch.duration_minutes = Number(data.duracion);
    }
    await this.repo.update(id, patch);
    return this.findOne(id);
  }

  delete(id: number) {
    return this.repo.delete(id);
  }
}
