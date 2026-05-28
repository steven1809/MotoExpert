import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating } from './entities/rating.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Cita } from '../citas/entities/cita.entity';
import { Empleado } from '../empleados/entities/empleado.entity';
import { NotificacionesService } from '../notificaciones/notificaciones.service';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating)
    private readonly repo: Repository<Rating>,
    @InjectRepository(Cita)
    private readonly citaRepo: Repository<Cita>,
    @InjectRepository(Empleado)
    private readonly empleadoRepo: Repository<Empleado>,
    private readonly notificacionesService: NotificacionesService,
  ) {}

  async create(
    userPayload: any,
    citaId: number,
    specialistRating: number,
    serviceRating: number,
    comment?: string,
  ) {
    const cita = await this.citaRepo.findOne({ 
      where: { id: citaId },
      relations: ['empleado', 'servicio', 'usuario']
    });
    if (!cita) throw new NotFoundException('Cita no encontrada');
    if (cita.estado !== 'FINALIZADO')
      throw new BadRequestException(
        'Solo puedes calificar servicios completados',
      );

    // Check if already rated
    const existingRating = await this.repo.findOne({
      where: { cita: { id: citaId } },
    });
    if (existingRating)
      throw new BadRequestException('Ya has calificado este servicio');

    const empleado = cita.empleado;
    
    // El objeto usuario del request tiene userId, lo mapeamos a id para TypeORM
    const usuario = { id: userPayload.userId } as Usuario;

    const rating = this.repo.create({
      usuario,
      cita,
      empleado,
      specialistRating,
      serviceRating,
      comment: comment || null,
    });

    const savedRating = await this.repo.save(rating);

    // Mark cita as rated
    cita.rated = true;
    await this.citaRepo.save(cita);

    // Send notification to empleado
    await this.notificacionesService.create(
      empleado.usuario, // Assuming Empleado has a usuario relation
      'new_rating',
      'You received a new rating',
      `A customer rated your service ${cita.servicio.nombre} ${specialistRating}/5 stars.`,
    );

    return savedRating;
  }

  async findByCita(citaId: number) {
    return this.repo.findOne({ where: { cita: { id: citaId } } });
  }

  async findByEmpleado(empleadoId: number) {
    // Find empleado by its id (assuming Empleado has an id field)
    const empleado = await this.empleadoRepo.findOne({
      where: { id: empleadoId },
    });
    if (!empleado) return [];

    return this.repo.find({
      where: { empleado: { id: empleadoId } },
      order: { createdAt: 'DESC' },
    });
  }

  async getEmpleadoStats(empleadoId: number) {
    const ratings = await this.findByEmpleado(empleadoId);
    const total = ratings.length;
    const averageSpecialistRating =
      total > 0
        ? ratings.reduce((sum, r) => sum + r.specialistRating, 0) / total
        : 0;

    return {
      totalReviews: total,
      averageRating: averageSpecialistRating.toFixed(1),
    };
  }

  async findAll() {
    return this.repo.find({
      order: { createdAt: 'DESC' },
      relations: ['usuario', 'cita', 'cita.servicio', 'cita.vehiculo', 'empleado'],
    });
  }

  async remove(id: number) {
    const rating = await this.repo.findOne({ where: { id } });
    if (!rating) {
      throw new NotFoundException('Calificación no encontrada');
    }
    return this.repo.remove(rating);
  }
}
