import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  async sendPasswordRecoveryEmail(email: string, nombre: string, code: string) {
    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Recupera tu contraseña - MotoExpert</title>
      </head>
      <body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#f4f4f4;">
        <div style="max-width:600px;margin:0 auto;background:#ffffff;">
          <div style="background:#1a56db;padding:30px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:24px;">MotoExpert</h1>
          </div>
          <div style="padding:40px 30px;">
            <h2 style="color:#333;font-size:20px;margin:0 0 20px;">Hola ${nombre || 'Usuario'},</h2>
            <p style="color:#666;font-size:16px;line-height:1.6;margin:0 0 30px;">
              Recibimos una solicitud para restablecer tu contraseña. Usa el siguiente código:
            </p>
            <div style="background:#f8f9fa;border:2px solid #1a56db;border-radius:12px;padding:20px;text-align:center;margin:0 0 30px;">
              <div style="font-size:36px;font-weight:bold;color:#1a56db;letter-spacing:10px;">${code}</div>
            </div>
            <p style="color:#999;font-size:14px;margin:0 0 10px;">Este código expira en 10 minutos.</p>
            <p style="color:#999;font-size:14px;margin:0;">Si no solicitaste esto, ignora este mensaje.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Recupera tu contraseña - MotoExpert',
      html,
    });
  }

  async sendContactEmail(payload: {
    nombre: string;
    email: string;
    telefono: string;
    tipo_servicio: string;
    mensaje: string;
  }) {
    const adminEmail =
      this.configService.get<string>('CONTACT_ADMIN_EMAIL') ||
      'pinillvalenciak@gmail.com';

    const safe = {
      nombre: (payload?.nombre || '').trim(),
      email: (payload?.email || '').trim(),
      telefono: (payload?.telefono || '').trim(),
      tipo_servicio: (payload?.tipo_servicio || '').trim(),
      mensaje: (payload?.mensaje || '').trim(),
    };

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Nuevo mensaje de contacto - MotoExpert</title>
      </head>
      <body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#f4f4f4;">
        <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
          <div style="background:#0b1220;padding:26px 28px;">
            <div style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.4px;">MotoExpert</div>
            <div style="color:#93c5fd;font-size:12px;margin-top:4px;">Nuevo mensaje de contacto</div>
          </div>
          <div style="padding:28px;">
            <div style="color:#111827;font-size:14px;line-height:1.6;">
              <div style="margin:0 0 10px;"><strong>Nombre:</strong> ${safe.nombre}</div>
              <div style="margin:0 0 10px;"><strong>Email:</strong> ${safe.email}</div>
              <div style="margin:0 0 10px;"><strong>Teléfono:</strong> ${safe.telefono}</div>
              <div style="margin:0 0 10px;"><strong>Servicio:</strong> ${safe.tipo_servicio}</div>
              <div style="margin:18px 0 0;"><strong>Mensaje:</strong></div>
              <div style="margin:8px 0 0;white-space:pre-wrap;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px;">${safe.mensaje}</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.mailerService.sendMail({
      to: adminEmail,
      subject: 'Nuevo mensaje de contacto - MotoExpert',
      html,
    });
  }
}
