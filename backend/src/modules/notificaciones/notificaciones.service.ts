import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notificacion } from './entities/notificacion.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';

@Injectable()
export class NotificacionesService {
  constructor(
    @InjectRepository(Notificacion)
    private readonly repo: Repository<Notificacion>,
  ) {}

  async create(
    usuario: Usuario,
    tipo: string,
    titulo: string,
    mensaje: string,
  ) {
    const notificacion = this.repo.create({
      usuario,
      tipo,
      titulo,
      mensaje,
      leida: false,
    });
    return this.repo.save(notificacion);
  }

  async findByUsuario(usuarioId: number) {
    return this.repo.find({
      where: { usuario: { id: usuarioId } },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: number) {
    const notificacion = await this.repo.findOne({ where: { id } });
    if (notificacion) {
      notificacion.leida = true;
      return await this.repo.save(notificacion);
    }
    return notificacion;
  }

  async markAllAsRead(usuarioId: number) {
    const notificaciones = await this.repo.find({
      where: { usuario: { id: usuarioId }, leida: false },
    });
    for (const notificacion of notificaciones) {
      notificacion.leida = true;
      await this.repo.save(notificacion);
    }
    return notificaciones;
  }
}
