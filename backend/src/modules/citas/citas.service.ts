import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { Cita } from './entities/cita.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Vehiculo } from '../vehiculos/entities/vehiculo.entity';
import { Servicio } from '../servicios/entities/servicio.entity';
import { Empleado } from '../empleados/entities/empleado.entity';
import { CreateCitaDto } from './dto/create-cita.dto';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { Payment } from '../pagos/entities/payment.entity';
import { OtpService } from '../otp/otp.service';
import { ActivityService } from '../activity/activity.service';

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
    private readonly otpService: OtpService,
    private readonly activityService: ActivityService,
  ) {}

  async create(dto: CreateCitaDto) {
    let vehiculo: Vehiculo | null = null;
    let usuario: Usuario | null = null;

    // 1. Identificar Usuario y Vehículo
    if (dto.vehiculoId) {
      vehiculo = await this.vehiculoRepo.findOne({
        where: { id: dto.vehiculoId },
        relations: ['usuario'],
      });
    }

    if (dto.usuarioId) {
      usuario = await this.usuarioRepo.findOne({
        where: { id: dto.usuarioId },
      });
    }

    // Lógica para GUEST si no hay usuario/vehículo autenticado
    if (!vehiculo && dto.guestData) {
      // Buscar vehículo por placa
      vehiculo = await this.vehiculoRepo.findOne({
        where: { placa: dto.guestData.placa },
        relations: ['usuario'],
      });

      if (!vehiculo) {
        // Si no existe el vehículo, necesitamos un usuario para asociarlo
        if (!usuario) {
          // Intentar buscar usuario por teléfono
          usuario = await this.usuarioRepo.findOne({
            where: { telefono: dto.guestData.telefono },
          });

          if (!usuario) {
            // Crear usuario temporal/guest
            usuario = this.usuarioRepo.create({
              nombre: dto.guestData.nombre,
              telefono: dto.guestData.telefono,
              role: 'cliente',
            });
            usuario = await this.usuarioRepo.save(usuario);
          }
        }

        // Crear vehículo
        vehiculo = this.vehiculoRepo.create({
          placa: dto.guestData.placa,
          usuario: usuario,
          marca: 'Genérico',
          modelo: 'Unidad',
        });
        vehiculo = await this.vehiculoRepo.save(vehiculo);
      }
    }

    if (!usuario && vehiculo?.usuario) {
      usuario = vehiculo.usuario;
    }

    if (!vehiculo || !usuario) {
      throw new BadRequestException(
        'Datos inválidos: vehículo o usuario no encontrado',
      );
    }

    const servicio = await this.servicioRepo.findOne({
      where: { id: dto.servicioId },
    });

    if (!servicio) {
      throw new BadRequestException('Servicio no encontrado');
    }

    // Aseguramos formato YYYY-MM-DD para la fecha
    const formattedFecha = new Date(dto.fecha).toISOString().split('T')[0];

    const durationMinutes =
      (servicio.duration_minutes ?? servicio.duracion ?? null) &&
      Number(servicio.duration_minutes ?? servicio.duracion)
        ? Number(servicio.duration_minutes ?? servicio.duracion)
        : 60;

    // Corregimos el parsing de la hora para evitar "Invalid Date"
    // Esperamos HH:mm o HH:mm:ss
    const timeRegex = /^(\d{1,2}):(\d{2})/;
    const match = dto.hora_inicio.match(timeRegex);
    if (!match) {
      throw new BadRequestException('Formato de hora de inicio inválido (se espera HH:mm)');
    }

    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);

    const startDateTime = new Date(formattedFecha);
    startDateTime.setHours(hours, minutes, 0, 0);

    const expectedEndDateTime = new Date(
      startDateTime.getTime() + durationMinutes * 60_000,
    );
    
    // Formatear hora_inicio y hora_fin como HH:mm:ss para PostgreSQL time type
    const computedHoraInicio = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    const computedHoraFin = expectedEndDateTime.toTimeString().slice(0, 8);

    let empleadoAsignado: Empleado | null;

    // Si el usuario seleccionó un empleado, usarlo
    if (dto.empleadoId) {
      // Primero intentamos buscar en la tabla de empleados por el ID del usuario (que es lo que manda el frontend)
      empleadoAsignado = await this.empleadoRepo.findOne({
        where: { usuarioId: dto.empleadoId },
      });

      // Si no se encuentra, intentamos buscar por el ID de la propia tabla empleados
      if (!empleadoAsignado) {
        empleadoAsignado = await this.empleadoRepo.findOne({
          where: { id: dto.empleadoId },
        });
      }

      if (!empleadoAsignado) {
        throw new BadRequestException(
          'El especialista seleccionado no existe en el sistema de empleados',
        );
      }

      // Verificar disponibilidad del empleado en ese horario
      const citasEmpleado = await this.repo.find({
        where: {
          fecha: formattedFecha,
          hora_inicio: computedHoraInicio,
          empleado: { id: empleadoAsignado.id },
        },
      });
      if (citasEmpleado.length > 0) {
        throw new BadRequestException(
          'El especialista ya tiene una cita en este horario',
        );
      }
    } else {
      // Lógica de Asignación Automática: Buscar empleado disponible
      const todosLosEmpleados = await this.empleadoRepo.find();

      // Obtenemos todas las citas de ese bloque de fecha y hora
      const citasOcupadas = await this.repo.find({
        where: {
          fecha: formattedFecha,
          hora_inicio: computedHoraInicio,
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
      hora_inicio: computedHoraInicio,
      hora_fin: computedHoraFin,
      expected_end_time: expectedEndDateTime,
      usuario,
      vehiculo,
      servicio,
      empleado: empleadoAsignado,
      estado: 'PENDIENTE',
      metodoPago: dto.metodoPago,
      esGuest: dto.esGuest,
    });

    const savedCita = await this.repo.save(cita);

    try {
      await this.activityService.logActivity(
        'CITA_CREADA',
        `Nueva cita agendada: ${servicio.nombre} para el ${formattedFecha}`,
        'cita',
        savedCita.id.toString(),
        usuario.nombre || 'sistema',
        usuario.role || 'usuario',
      );
    } catch (error) {
      console.error('Error logging activity:', error);
    }

    // Generar y enviar código de entrega
    try {
      const deliveryCode = await this.otpService.generateOtp(usuario.id, 'delivery-code');
      savedCita.codigoEntrega = deliveryCode;
      await this.repo.save(savedCita);

      await this.notificacionesService.create(
        usuario,
        'service_scheduled',
        'Servicio Programado Exitosamente',
        `Tu servicio de ${servicio.nombre} para el vehículo ${vehiculo.placa} ha sido agendado para el ${formattedFecha} a las ${dto.hora_inicio}. Tu código de entrega es: ${deliveryCode}`,
      );
      
      // Enviar WhatsApp si el usuario tiene teléfono
      const telefono = usuario.telefono || (dto.guestData?.telefono);
      if (telefono) {
        const empleadoNombre = empleadoAsignado.usuario 
          ? `${empleadoAsignado.usuario.nombre} ${empleadoAsignado.usuario.apellidos || ''}`.trim()
          : 'Nuestro especialista';
          
        const mensaje = `🔧 MotoExpert - Cita Confirmada!\n` +
          `Servicio: ${servicio.nombre}\n` +
          `Vehículo: ${vehiculo.placa}\n` +
          `Especialista: ${empleadoNombre}\n` +
          `Fecha: ${formattedFecha}\n` +
          `Hora: ${dto.hora_inicio}\n` +
          `🎫 Código de entrega: ${deliveryCode}`;
          
        await this.notificacionesService.sendWhatsApp(telefono, mensaje);
      }
    } catch (error) {
      console.error('Error al generar código de entrega o notificar:', error);
    }

    return savedCita;
  }

  async forceCancel(id: number, userRole: string) {
    if (userRole !== 'admin') {
      throw new ForbiddenException('Only administrators can force cancellation');
    }

    const cita = await this.repo.findOne({
      where: { id },
      relations: ['usuario', 'vehiculo', 'servicio'],
    });
    if (!cita) throw new NotFoundException('Cita no encontrada');

    if (cita.estado === 'FINALIZADO' || cita.estado === 'CANCELADO') {
      throw new BadRequestException('Cannot cancel a completed or already cancelled appointment');
    }

    cita.estado = 'CANCELADO';
    const savedCita = await this.repo.save(cita);

    try {
      await this.activityService.logActivity(
        'CITA_CANCELADA',
        `Cita #${id} cancelada por el administrador`,
        'cita',
        id.toString(),
        'sistema',
        'admin',
      );
    } catch (error) {
      console.error('Error logging activity:', error);
    }

    // Notificar al usuario
    await this.notificacionesService.create(
      cita.usuario,
      'service_cancelled',
      'Tu cita ha sido cancelada por el administrador',
      `Tu servicio de ${cita.servicio.nombre} para el vehículo ${cita.vehiculo.placa} ha sido cancelado por el administrador.`,
    );

    return savedCita;
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
    userRole?: string,
    userId?: number,
  ) {
    // Removed payment validation since we now use delivery code validation via verificar-entrega endpoint

    const cita = await this.repo.findOne({ 
      where: { id },
      relations: ['usuario', 'vehiculo', 'servicio'] 
    });
    if (!cita) throw new NotFoundException('Cita no encontrada');

    // If user is not admin/empleado, check that they own this cita
    if (userRole !== 'admin' && userRole !== 'empleado' && userRole !== 'trabajador') {
      if (cita.usuario.id !== userId) {
        throw new ForbiddenException('No tienes permisos para modificar esta cita');
      }
    }

    // Handle cancellation penalty logic
    if (nuevoEstado === 'CANCELADO') {
      const nowInBogota = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }));
      const citaDate = new Date(`${cita.fecha}T${cita.hora_inicio}`);
      const timeDiffMs = citaDate.getTime() - nowInBogota.getTime();
      const timeDiffHours = timeDiffMs / (1000 * 60 * 60);

      // Check if cancelling with less than 24 hours notice
      if (timeDiffHours < 24) {
        // Apply penalty: Let's store a cancellation count in usuario entity
        const usuario = await this.usuarioRepo.findOne({ where: { id: cita.usuario.id } });
        if (usuario) {
          // If user doesn't have a cancellation count, initialize it
          if (!usuario.numCancelaciones) {
            usuario.numCancelaciones = 0;
          }
          usuario.numCancelaciones += 1;
          
          // If user has 3 or more cancellations with less than 24 hours notice, block them for 7 days
          if (usuario.numCancelaciones >= 3) {
            usuario.bloqueadoHasta = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
          }
          await this.usuarioRepo.save(usuario);
        }
      }

      // Store cancellation timestamp on cita
      cita.canceladaAt = new Date();
    }

    cita.estado = nuevoEstado;

    if (nuevoEstado === 'FINALIZADO') {
      cita.completedAt = new Date();
      if (report) {
        cita.report = report;
      }
    }

    const savedCita = await this.repo.save(cita);

    try {
      if (nuevoEstado === 'FINALIZADO') {
        await this.activityService.logActivity(
          'CITA_FINALIZADA',
          `Cita #${id} marcada como finalizada`,
          'cita',
          id.toString(),
          'sistema',
          userRole === 'admin' ? 'admin' : 'empleado',
        );
      } else if (nuevoEstado === 'CANCELADO') {
        await this.activityService.logActivity(
          'CITA_CANCELADA',
          `Cita #${id} eliminada/cancelada del sistema`,
          'cita',
          id.toString(),
          'sistema',
          userRole === 'admin' ? 'admin' : 'sistema',
        );
      }
    } catch (error) {
      console.error('Error logging activity:', error);
    }

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
    } else if (nuevoEstado === 'CANCELADO') {
      await this.notificacionesService.create(
        cita.usuario,
        'service_cancelled',
        'Your appointment has been cancelled',
        `Your ${cita.servicio.nombre} for vehicle ${cita.vehiculo.placa} has been cancelled by the administrator.`,
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

    // Horario fijo del negocio
    const HORARIO_NEGOCIO = {
      1: { inicio: 8, fin: 18 }, // Lunes
      2: { inicio: 8, fin: 18 }, // Martes
      3: { inicio: 8, fin: 18 }, // Miércoles
      4: { inicio: 8, fin: 18 }, // Jueves
      5: { inicio: 8, fin: 18 }, // Viernes
      6: { inicio: 8, fin: 14 }, // Sábado
      0: null                    // Domingo - CERRADO
    };

    const dateObj = new Date(fecha + 'T12:00:00');
    const formattedFecha = dateObj.toISOString().split('T')[0];
    const dayOfWeek = dateObj.getDay();

    console.log(`[DEBUG] Fecha seleccionada: ${formattedFecha} (Día: ${dayOfWeek})`);

    const horario = HORARIO_NEGOCIO[dayOfWeek as keyof typeof HORARIO_NEGOCIO];
    if (!horario) {
      console.log(`[DEBUG] Negocio cerrado para el día: ${dayOfWeek}`);
      return [];
    }

    // BYPASS DE DESARROLLO: Permitir pruebas en festivos
    const IS_DEV_MODE = true; 

    // Determinar ID real del empleado
    let actualEmpleadoId = empleadoId;
    if (empleadoId) {
      let empleado = await this.empleadoRepo.findOne({ where: { usuarioId: empleadoId } });
      if (!empleado) {
        empleado = await this.empleadoRepo.findOne({ where: { id: empleadoId } });
      }
      if (empleado) {
        actualEmpleadoId = empleado.id;
      }
    }

    // Generar Master Schedule basado en HORARIO_NEGOCIO
    const masterSchedule: string[] = [];
    for (let h = horario.inicio; h < horario.fin; h++) {
      masterSchedule.push(`${h.toString().padStart(2, '0')}:00:00`);
    }
    console.log(`[DEBUG] Master Schedule generado:`, masterSchedule);

    // 3. Validar Horas Pasadas (Si es hoy)
    const bogotaTimeStr = new Date().toLocaleString("en-US", { timeZone: "America/Bogota" });
    const nowBogota = new Date(bogotaTimeStr);
    const todayStr = nowBogota.getFullYear() + '-' + 
                    String(nowBogota.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(nowBogota.getDate()).padStart(2, '0');

    const esHoy = formattedFecha === todayStr;

    let citasDelDia: Cita[] = [];
    if (actualEmpleadoId) {
      citasDelDia = await this.repo.find({
        where: {
          fecha: formattedFecha,
          empleado: { id: actualEmpleadoId },
          estado: Not(In(['CANCELADO', 'FINALIZADO']))
        },
      });
    } else {
      citasDelDia = await this.repo.find({
        where: { 
          fecha: formattedFecha,
          estado: Not(In(['CANCELADO', 'FINALIZADO']))
        },
      });
    }

    const slots = masterSchedule.map((horaStr) => {
      const [h] = horaStr.split(':').map(Number);
      const citaExistente = citasDelDia.find((c) => c.hora_inicio === horaStr);
      
      let disponible = !citaExistente;

      if (esHoy) {
        const horaActual = nowBogota.getHours();
        // Si el slot es menor o igual a la hora actual
        if (h <= horaActual) {
          disponible = false;
        }
      }

      // En modo dev, si no hay cita existente, forzamos disponible para slots futuros
      if (IS_DEV_MODE && !citaExistente) {
        if (esHoy) {
          const horaActual = nowBogota.getHours();
          if (h > horaActual) disponible = true;
        } else {
          disponible = true;
        }
      }

      return {
        hora: horaStr.substring(0, 5), // Formato HH:mm
        disponible,
      };
    });

    return slots;
  }

  async findAll(
    userId?: number,
    rol?: string,
    page: number = 1,
    limit: number = 10,
    estado?: string,
  ): Promise<any> {
    const skip = (page - 1) * limit;
    const relations = [
      'usuario',
      'vehiculo',
      'servicio',
      'empleado',
      'empleado.usuario',
      'payment',
    ];

    // SI ES EMPLEADO
    if (userId && rol === 'empleado') {
      const empleado = await this.empleadoRepo
        .createQueryBuilder('empleado')
        .innerJoin('empleado.usuario', 'usuario')
        .where('usuario.id = :userId', { userId })
        .getOne();

      if (!empleado) {
        return { data: [], total: 0, page, limit, totalPages: 0 };
      }

      const where: any = { empleado: { id: empleado.id } };
      if (estado && estado !== 'TODAS') {
        where.estado = estado;
      }

      const [data, total] = await this.repo.findAndCount({
        where,
        relations,
        order: { fecha: 'DESC', hora_inicio: 'DESC' },
        skip,
        take: limit,
      });

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }

    // SI ES USUARIO NORMAL
    if (userId) {
      const where: any = { usuario: { id: userId } };
      if (estado && estado !== 'TODAS') {
        where.estado = estado;
      }

      const [data, total] = await this.repo.findAndCount({
        where,
        relations,
        order: { fecha: 'DESC', hora_inicio: 'DESC' },
        skip,
        take: limit,
      });

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }

    // ADMIN
    const where: any = {};
    if (estado && estado !== 'TODAS') {
      where.estado = estado;
    }

    const [data, total] = await this.repo.findAndCount({
      where,
      relations,
      order: { fecha: 'DESC', hora_inicio: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    return await this.repo.findOne({
      where: { id },
      relations: [
        'usuario',
        'vehiculo',
        'servicio',
        'empleado',
        'empleado.usuario',
        'payment',
      ],
    });
  }

  async reschedule(id: number, fecha: string, hora_inicio: string) {
    const cita = await this.repo.findOne({ where: { id }, relations: ['usuario', 'vehiculo', 'servicio'] });
    if (!cita) throw new NotFoundException('Cita no encontrada');

    cita.fecha = fecha;
    cita.hora_inicio = hora_inicio;
    const savedCita = await this.repo.save(cita);

    try {
      await this.activityService.logActivity(
        'CITA_REPROGRAMADA',
        `Cita #${id} reprogramada para el ${fecha} a las ${hora_inicio}`,
        'cita',
        id.toString(),
        'sistema',
        'admin',
      );
    } catch (error) {
      console.error('Error logging activity:', error);
    }

    return savedCita;
  }

  async cancelarPorUsuario(id: number, motivo: string, userId: number) {
    const cita = await this.repo.findOne({ where: { id }, relations: ['usuario'] });
    if (!cita) {
      throw new NotFoundException('Cita no encontrada');
    }

    // Verify the user owns this appointment
    if (cita.usuario.id !== userId) {
      throw new ForbiddenException('No tienes permisos para cancelar esta cita');
    }

    // Calculate if penalty applies (<24 hours notice)
    const nowInBogota = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
    const citaDate = new Date(`${cita.fecha}T${cita.hora_inicio}`);
    const diffMs = citaDate.getTime() - nowInBogota.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const penalizacion = diffHours < 24;

    // Update appointment
    await this.repo.update(id, {
      estado: 'CANCELADA',
      motivo_cancelacion: motivo,
      canceladaAt: nowInBogota
    });

    // Apply penalty if needed
    if (penalizacion) {
      await this.usuarioRepo.increment(
        { id: userId },
        'cancelaciones_sin_aviso',
        1
      );

      // Optional: Block user if they have 3+ penalties
      const updatedUser = await this.usuarioRepo.findOne({ where: { id: userId } });
      if (updatedUser && updatedUser.cancelaciones_sin_aviso >= 3) {
        updatedUser.bloqueadoHasta = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        await this.usuarioRepo.save(updatedUser);
      }
    }

    // Log activity
    try {
      await this.activityService.logActivity(
        'CITA_CANCELADA',
        `Cita #${id} cancelada por usuario. Motivo: ${motivo || 'No especificado'}`,
        'cita',
        id.toString(),
        'usuario',
        userId.toString(),
      );
    } catch (error) {
      console.error('Error logging activity:', error);
    }

    return {
      message: 'Cita cancelada exitosamente',
      penalizacion,
      aviso: penalizacion
        ? 'Se registró una penalización por cancelar con menos de 24 horas de anticipación'
        : null,
    };
  }

  async remove(id: number, motivo?: string) {
    const cita = await this.findOne(id);
    const result = await this.repo.delete(id);
    
    try {
      if (cita) {
        await this.activityService.logActivity(
          'CITA_ELIMINADA_FORZADA',
          `Cita #${id} eliminada permanentemente. Motivo: ${motivo || 'No especificado'}`,
          'cita',
          id.toString(),
          'sistema',
          'admin',
        );
      }
    } catch (error) {
      console.error('Error logging activity:', error);
    }
    
    return result;
  }
}
