import { Body, Controller, Get, Header, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { MailService } from './modules/mail/mail.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly mailService: MailService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('contacto')
  @Header('Content-Type', 'application/json; charset=utf-8')
  async contacto(
    @Body()
    body: {
      nombre: string;
      email: string;
      telefono: string;
      tipo_servicio: string;
      mensaje: string;
    },
  ) {
    await this.mailService.sendContactEmail(body);
    return { ok: true };
  }
}
