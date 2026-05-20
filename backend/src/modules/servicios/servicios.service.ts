import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Servicio } from './entities/servicio.entity';
import { Repository } from 'typeorm';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';

type ServiciosFilters = {
  categoria?: string;
  tipo_vehiculo?: string;
  precio_desde?: string;
  precio_hasta?: string;
  duracion?: string;
  orden?: string;
};

@Injectable()
export class ServiciosService implements OnModuleInit {
  constructor(
    @InjectRepository(Servicio)
    private repo: Repository<Servicio>,
  ) {}

  private normalize(t: string) {
    return (t || '')
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private categoriaToken(raw: string) {
    const normalized = this.normalize(raw);
    if (normalized.includes('lav')) return 'lavado';
    if (normalized.includes('mot')) return 'motor';
    if (normalized.includes('limp')) return 'limpieza';
    if (normalized.includes('prot')) return 'protecc';
    if (normalized.includes('pul')) return 'pulido';
    return normalized;
  }

  private getTiposVehiculo(servicio: Servicio) {
    const name = this.normalize(servicio?.nombre || '');
    if (name.includes('express')) {
      return ['Auto', 'Moto', 'Camioneta', 'SUV'];
    }
    return ['Auto', 'Camioneta', 'SUV'];
  }

  async onModuleInit() {
    const servicios = await this.repo.find();
    const defaults: Record<string, number> = {
      'lavado basico': 45,
      'lavado especial': 60,
      polichado: 90,
      'limpieza de cadena': 30,
    };

    const updates: Promise<unknown>[] = [];
    for (const s of servicios) {
      const key = this.normalize(s.nombre);
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

  async findAll(filters: ServiciosFilters = {}) {
    const qb = this.repo.createQueryBuilder('servicio');

    const categoriaRaw = (filters.categoria || '').toString().trim();
    if (categoriaRaw) {
      const token = this.categoriaToken(categoriaRaw);
      qb.andWhere('LOWER(servicio.nombre) LIKE :categoria', {
        categoria: `%${token}%`,
      });
    }

    const precioDesde = Number(filters.precio_desde);
    if (Number.isFinite(precioDesde)) {
      qb.andWhere('servicio.precio >= :precioDesde', { precioDesde });
    }

    const precioHasta = Number(filters.precio_hasta);
    if (Number.isFinite(precioHasta)) {
      qb.andWhere('servicio.precio <= :precioHasta', { precioHasta });
    }

    const durationExpr = 'COALESCE(servicio.duration_minutes, servicio.duracion, 0)';
    const duracion = (filters.duracion || '').toString().trim().toLowerCase();
    if (duracion === 'rapido') {
      qb.andWhere(`${durationExpr} > 0 AND ${durationExpr} < :max`, { max: 60 });
    } else if (duracion === 'medio') {
      qb.andWhere(`${durationExpr} BETWEEN :min AND :max`, { min: 60, max: 180 });
    } else if (duracion === 'completo') {
      qb.andWhere(`${durationExpr} > :min`, { min: 180 });
    }

    const orden = (filters.orden || '').toString().trim().toLowerCase();
    if (orden === 'precio_asc') {
      qb.orderBy('servicio.precio', 'ASC');
    } else if (orden === 'precio_desc') {
      qb.orderBy('servicio.precio', 'DESC');
    } else {
      qb.orderBy('servicio.id', 'DESC');
    }

    const servicios = await qb.getMany();

    const tipoVehiculoRaw = (filters.tipo_vehiculo || '').toString().trim();
    if (!tipoVehiculoRaw) return servicios;

    const target = this.normalize(tipoVehiculoRaw);
    return servicios.filter((s) => {
      const allowed = this.getTiposVehiculo(s);
      return allowed.some((t) => this.normalize(t) === target);
    });
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
