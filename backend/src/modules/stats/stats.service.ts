import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Cita } from '../citas/entities/cita.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Cita)
    private readonly citaRepo: Repository<Cita>,
  ) {}

  private getDateRange(period: 'today' | 'yesterday' | 'week' | 'month' | 'year') {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
    const today = now.toISOString().split('T')[0];
    
    let from: string, to: string;

    switch (period) {
      case 'today':
        from = today;
        to = today;
        break;
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        from = yesterday.toISOString().split('T')[0];
        to = from;
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        from = weekStart.toISOString().split('T')[0];
        to = today;
        break;
      case 'month':
        from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        to = today;
        break;
      case 'year':
        from = `${now.getFullYear()}-01-01`;
        to = today;
        break;
    }

    return { from, to };
  }

  private async calculateStats(from: string, to: string) {
    const [completedCitas, cancelledCitas] = await Promise.all([
      this.citaRepo
        .createQueryBuilder('cita')
        .innerJoinAndSelect('cita.servicio', 'servicio')
        .innerJoinAndSelect('cita.empleado', 'empleado')
        .innerJoinAndSelect('empleado.usuario', 'empleadoUsuario')
        .where('cita.fecha BETWEEN :from AND :to', { from, to })
        .andWhere('cita.estado = :estado', { estado: 'FINALIZADO' })
        .getMany(),
      this.citaRepo
        .createQueryBuilder('cita')
        .where('cita.fecha BETWEEN :from AND :to', { from, to })
        .andWhere('cita.estado = :estado', { estado: 'CANCELADO' })
        .getCount(),
    ]);

    const totalIngresos = completedCitas.reduce((sum, cita) => sum + (Number(cita.servicio.precio) || 0), 0);
    const serviciosRealizados = completedCitas.length;

    // Calcular técnico más activo
    const empleadoCount: Record<number, { count: number; nombre: string }> = {};
    completedCitas.forEach((cita) => {
      const empId = cita.empleado.id;
      if (!empleadoCount[empId]) {
        empleadoCount[empId] = {
          count: 0,
          nombre: cita.empleado.usuario?.nombre || 'Técnico',
        };
      }
      empleadoCount[empId].count++;
    });

    let tecnicoMasActivo = { nombre: 'N/A', count: 0 };
    Object.values(empleadoCount).forEach((emp) => {
      if (emp.count > tecnicoMasActivo.count) {
        tecnicoMasActivo = emp;
      }
    });

    // Calcular servicio más vendido
    const servicioCount: Record<number, { count: number; nombre: string }> = {};
    completedCitas.forEach((cita) => {
      const servId = cita.servicio.id;
      if (!servicioCount[servId]) {
        servicioCount[servId] = {
          count: 0,
          nombre: cita.servicio.nombre || 'Servicio',
        };
      }
      servicioCount[servId].count++;
    });

    let servicioMasVendido = { nombre: 'N/A', count: 0 };
    Object.values(servicioCount).forEach((serv) => {
      if (serv.count > servicioMasVendido.count) {
        servicioMasVendido = serv;
      }
    });

    return {
      totalIngresos,
      serviciosRealizados,
      serviciosCancelados: cancelledCitas,
      tecnicoMasActivo,
      servicioMasVendido,
    };
  }

  async getTodayStats() {
    const { from, to } = this.getDateRange('today');
    return this.calculateStats(from, to);
  }

  async getYesterdayStats() {
    const { from, to } = this.getDateRange('yesterday');
    return this.calculateStats(from, to);
  }

  async getWeekStats() {
    const { from, to } = this.getDateRange('week');
    return this.calculateStats(from, to);
  }

  async getMonthStats() {
    const { from, to } = this.getDateRange('month');
    return this.calculateStats(from, to);
  }

  async getYearStats() {
    const { from, to } = this.getDateRange('year');
    return this.calculateStats(from, to);
  }

  async getRangeStats(from: string, to: string) {
    return this.calculateStats(from, to);
  }

  async getDetailStats(date: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await this.citaRepo
      .createQueryBuilder('cita')
      .innerJoinAndSelect('cita.servicio', 'servicio')
      .innerJoinAndSelect('cita.empleado', 'empleado')
      .innerJoinAndSelect('empleado.usuario', 'empleadoUsuario')
      .innerJoinAndSelect('cita.usuario', 'usuario')
      .innerJoinAndSelect('cita.vehiculo', 'vehiculo')
      .where('cita.fecha = :date', { date })
      .andWhere('cita.estado = :estado', { estado: 'FINALIZADO' })
      .orderBy('cita.hora_inicio', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const formattedData = data.map((cita) => ({
      id: cita.id,
      servicio: cita.servicio.nombre,
      precio: Number(cita.servicio.precio) || 0,
      empleado: cita.empleado.usuario?.nombre || 'Técnico',
      cliente: cita.usuario.nombre || 'Cliente',
      fecha: cita.fecha,
      hora: cita.hora_inicio,
      vehiculo: cita.vehiculo.placa,
      subtotal: Number(cita.servicio.precio) || 0,
    }));

    return {
      data: formattedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getSummaryStats() {
    const [today, yesterday, month, year] = await Promise.all([
      this.getTodayStats(),
      this.getYesterdayStats(),
      this.getMonthStats(),
      this.getYearStats(),
    ]);

    return { today, yesterday, month, year };
  }
}
