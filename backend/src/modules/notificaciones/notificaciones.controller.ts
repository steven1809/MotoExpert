import {
  Controller,
  Get,
  Patch,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('notificaciones')
@UseGuards(AuthGuard('jwt'))
export class NotificacionesController {
  constructor(private readonly service: NotificacionesService) {}

  @Get()
  findByUsuario(@Request() req) {
    return this.service.findByUsuario(req.user.userId);
  }

  @Patch(':id/marcar-leida')
  markAsRead(@Param('id') id: string) {
    return this.service.markAsRead(+id);
  }

  @Patch('marcar-todas-leidas')
  markAllAsRead(@Request() req) {
    return this.service.markAllAsRead(req.user.userId);
  }
}
