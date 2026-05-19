import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cita } from './entities/cita.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Vehiculo } from '../vehiculos/entities/vehiculo.entity';
import { Servicio } from '../servicios/entities/servicio.entity';
import { Empleado } from '../empleados/entities/empleado.entity';
import { CreateCitaDto } from './dto/create-cita.dto';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { Payment } from '../pagos/entities/payment.entity';

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

    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,

    private readonly notificacionesService: NotificacionesService,
  ) {}

  async create(dto: CreateCitaDto) {
    const usuario = await this.usuarioRepo.findOne({
      where: { id: dto.usuarioId },
    });
    const vehiculo = await this.vehiculoRepo.findOne({
      where: { id: dto.vehiculoId },
    });
    const servicio = await this.servicioRepo.findOne({
      where: { id: dto.servicioId },
    });

    if (!usuario || !vehiculo || !servicio) {
      throw new BadRequestException(
        'Datos inválidos: usuario, vehículo o servicio no encontrado',
      );
    }

    // Aseguramos formato YYYY-MM-DD para la fecha
    const formattedFecha = new Date(dto.fecha).toISOString().split('T')[0];

    const durationMinutes =
      (servicio.duration_minutes ?? servicio.duracion ?? null) &&
      Number(servicio.duration_minutes ?? servicio.duracion)
        ? Number(servicio.duration_minutes ?? servicio.duracion)
        : 60;

    const startDateTime = new Date(`${formattedFecha}T${dto.hora_inicio}`);
    if (!Number.isFinite(startDateTime.getTime())) {
      throw new BadRequestException('Fecha u hora de inicio inválida');
    }

    const expectedEndDateTime = new Date(
      startDateTime.getTime() + durationMinutes * 60_000,
    );
    const computedHoraFin = expectedEndDateTime.toTimeString().slice(0, 8);

    let empleadoAsignado: Empleado | null;

    // Si el usuario seleccionó un empleado, usarlo
    if (dto.empleadoId) {
      empleadoAsignado = await this.empleadoRepo.findOne({
        where: { id: dto.empleadoId, estado: 'activo' },
      });
      if (!empleadoAsignado) {
        throw new BadRequestException(
          'El especialista seleccionado no está disponible',
        );
      }

      // Verificar disponibilidad del empleado en ese horario
      const citasEmpleado = await this.repo.find({
        where: {
          fecha: formattedFecha,
          hora_inicio: dto.hora_inicio,
          empleado: { id: dto.empleadoId },
        },
      });
      if (citasEmpleado.length > 0) {
        throw new BadRequestException(
          'El especialista ya tiene una cita en este horario',
        );
      }
    } else {
      // Lógica de Asignación Automática: Buscar empleado disponible
      const todosLosEmpleados = await this.empleadoRepo.find({
        where: { estado: 'activo' },
      });

      // Obtenemos todas las citas de ese bloque de fecha y hora
      const citasOcupadas = await this.repo.find({
        where: {
          fecha: formattedFecha,
          hora_inicio: dto.hora_inicio,
        },
        relations: ['empleado'],
      });

      // Filtramos empleados que ya tengan una cita en ese horario
      const empleadosOcupadosIds = citasOcupadas.map((c) => c.empleado.id);
      const empleadosDisponibles = todosLosEmpleados.filter(
        (e) => !empleadosOcupadosIds.includes(e.id),
      );

      if (empleadosDisponibles.length === 0) {
        throw new BadRequestException(
          'El horario ya no está disponible por falta de personal',
        );
      }

      // Asignamos el primer empleado disponible
      empleadoAsignado = empleadosDisponibles[0];
    }

    const cita = this.repo.create({
      fecha: formattedFecha,
      hora_inicio: dto.hora_inicio,
      hora_fin: computedHoraFin,
      expected_end_time: expectedEndDateTime,
      usuario,
      vehiculo,
      servicio,
      empleado: empleadoAsignado,
      estado: 'PENDIENTE',
    });

    return this.repo.save(cita);
  }

  async updateEstado(
    id: number,
    nuevoEstado: string,
    report?: {
      workPerformed: string;
      partsUsed?: string;
      observations?: string;
      condition: 'optimal' | 'attention' | 'urgent';
    },
  ) {
    if (nuevoEstado === 'FINALIZADO') {
      const payment = await this.paymentRepo.findOneBy({ appointmentId: id });
      if (!payment) {
        throw new ForbiddenException('La cita no tiene pago registrado');
      }
      if (!payment.tokenUsed) {
        throw new ForbiddenException(
          'Debes validar el token del cliente antes de finalizar',
        );
      }
    }

    const cita = await this.repo.findOne({ where: { id } });
    if (!cita) throw new NotFoundException('Cita no encontrada');

    cita.estado = nuevoEstado;

    if (nuevoEstado === 'FINALIZADO') {
      cita.completedAt = new Date();
      if (report) {
        cita.report = report;
      }
    }

    const savedCita = await this.repo.save(cita);

    // Create notification based on estado
    if (nuevoEstado === 'EN PROCESO') {
      await this.notificacionesService.create(
        cita.usuario,
        'service_started',
        'Your service has started',
        `Your ${cita.servicio.nombre} for vehicle ${cita.vehiculo.placa} has begun. Our specialist is now working on your unit.`,
      );
    } else if (nuevoEstado === 'FINALIZADO') {
      await this.notificacionesService.create(
        cita.usuario,
        'service_completed',
        'Your service has been completed',
        `Your ${cita.servicio.nombre} for vehicle ${cita.vehiculo.placa} is done. Tap to view the full service report.`,
      );
    }

    return savedCita;
  }

  async getAvailableSlots(
    fecha: string,
    servicioId: number,
    empleadoId?: number,
  ) {
    const servicio = await this.servicioRepo.findOne({
      where: { id: servicioId },
    });
    if (!servicio) throw new NotFoundException('Servicio no encontrado');

    // Horario Maestro: 8:00 AM a 12:00 PM y 2:00 PM a 6:00 PM
    const masterSchedule = [
      '08:00:00',
      '09:00:00',
      '10:00:00',
      '11:00:00',
      '14:00:00',
      '15:00:00',
      '16:00:00',
      '17:00:00',
    ];

    // Obtenemos todas las citas de ese día (asegurando formato YYYY-MM-DD)
    const formattedFecha = new Date(fecha).toISOString().split('T')[0];

    let citasDelDia;
    if (empleadoId) {
      // Si hay empleadoId, filtramos citas solo para ese empleado
      citasDelDia = await this.repo.find({
        where: {
          fecha: formattedFecha,
          empleado: { id: empleadoId },
        },
        relations: ['empleado'],
      });
    } else {
      // Sin empleadoId, obtenemos todas las citas del día
      citasDelDia = await this.repo.find({
        where: { fecha: formattedFecha },
        relations: ['empleado'],
      });
    }

    // Generamos los slots basados en el Horario Maestro y marcamos disponibilidad
    const slots = masterSchedule.map((horaStr) => {
      // Verificamos si hay alguna cita en este horario
      const citaExistente = citasDelDia.find((c) => c.hora_inicio === horaStr);

      return {
        hora: horaStr,
        disponible: !citaExistente,
      };
    });

    return slots;
  }

  async findAll(userId?: number, rol?: string) {
    // SI ES EMPLEADO
    if (userId && rol === 'empleado') {
      const empleado = await this.empleadoRepo
        .createQueryBuilder('empleado')
        .innerJoin('empleado.usuario', 'usuario')
        .where('usuario.id = :userId', { userId })
        .getOne();

      if (!empleado) {
        return [];
      }

      return this.repo.find({
        where: {
          empleado: {
            id: empleado.id,
          },
        },
        relations: ['usuario', 'vehiculo', 'servicio', 'empleado', 'payment'],
      });
    }

    // SI ES USUARIO NORMAL
    if (userId) {
      return this.repo.find({
        where: {
          usuario: {
            id: userId,
          },
        },
        relations: ['usuario', 'vehiculo', 'servicio', 'empleado', 'payment'],
      });
    }

    // ADMIN
    return this.repo.find({
      relations: ['usuario', 'vehiculo', 'servicio', 'empleado', 'payment'],
    });
  }

  findOne(id: number) {
    return this.repo.findOne({
      where: { id },
      relations: ['usuario', 'vehiculo', 'servicio', 'empleado', 'payment'],
    });
  }

  remove(id: number) {
    return this.repo.delete(id);
  }
}
