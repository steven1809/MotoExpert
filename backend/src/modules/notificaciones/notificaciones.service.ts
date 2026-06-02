import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notificacion } from './entities/notificacion.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { ConfigService } from '@nestjs/config';
import Twilio from 'twilio';

@Injectable()
export class NotificacionesService {
  private twilioClient: Twilio.Twilio | null = null;

  constructor(
    @InjectRepository(Notificacion)
    private readonly repo: Repository<Notificacion>,
    private configService: ConfigService,
  ) {
    const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
    if (accountSid && authToken) {
      this.twilioClient = Twilio(accountSid, authToken);
    }
  }

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

  async sendWhatsApp(to: string, message: string) {
    const twilioFrom = this.configService.get('TWILIO_FROM_WHATSAPP');
    if (!this.twilioClient || !twilioFrom) {
      console.warn('[WhatsApp] Twilio not configured. Skipping message.');
      return false;
    }

    try {
      // Make sure the phone number has a + prefix
      let formattedTo = to;
      if (!formattedTo.startsWith('+')) {
        formattedTo = `+${formattedTo}`;
      }

      const result = await this.twilioClient.messages.create({
        body: message,
        from: twilioFrom,
        to: `whatsapp:${formattedTo}`,
      });
      
      console.log(`[WhatsApp] Message sent successfully: ${result.sid}`);
      return true;
    } catch (err) {
      console.error('[WhatsApp] Error sending message:', err);
      return false;
    }
  }
}
