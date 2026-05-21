import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  Patch,
} from '@nestjs/common';
import { CitasService } from './citas.service';
import { CreateCitaDto } from './dto/create-cita.dto';
import { AuthGuard } from '@nestjs/passport';
import { AppointmentChatsService } from './appointment-chats.service';

@Controller('citas')
@UseGuards(AuthGuard('jwt'))
export class CitasController {
  constructor(
    private readonly service: CitasService,
    private readonly chatsService: AppointmentChatsService,
  ) {}

  @Post()
  create(@Body() dto: CreateCitaDto, @Request() req) {
    console.log('[DEBUG] Recibiendo DTO para crear cita:', dto);
    // Forzamos que la cita sea para el usuario autenticado
    const finalDto = { ...dto, usuarioId: req.user.userId };
    console.log('[DEBUG] DTO Final con usuarioId del JWT:', finalDto);
    return this.service.create(finalDto);
  }
  @Get()
  findAll(@Request() req, @Query('userId') userId?: string) {
    console.log('[DEBUG] req.user:', req.user);

    const userRole = (req.user.rol || req.user.role)?.toLowerCase();

    console.log('[DEBUG] userRole:', userRole);

    // ADMIN VE TODO
    if (userRole === 'admin') {
      if (userId) {
        return this.service.findAll(+userId, userRole);
      }

      return this.service.findAll(undefined, userRole);
    }

    // EMPLEADO VE SUS CITAS
    if (userRole === 'empleado' || userRole === 'trabajador') {
      return this.service.findAll(req.user.userId, 'empleado');
    }

    // USUARIO NORMAL
    return this.service.findAll(req.user.userId, 'usuario');
  }

  @Get('disponibilidad')
  checkAvailability(
    @Query('fecha') fecha: string,
    @Query('servicioId') servicioId: string,
    @Query('empleadoId') empleadoId?: string,
  ) {
    return this.service.getAvailableSlots(
      fecha,
      +servicioId,
      empleadoId ? +empleadoId : undefined,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const cita = await this.service.findOne(+id);
    if (
      cita &&
      req.user.rol !== 'admin' &&
      cita.usuario.id !== req.user.userId
    ) {
      return null;
    }
    return cita;
  }

  @Patch(':id/estado')
  updateEstado(
    @Param('id') id: string,
    @Body() body: { estado: string; report?: any },
    @Request() req,
  ) {
    const userRole = (req.user.rol || req.user.role)?.toLowerCase();
    return this.service.updateEstado(+id, body.estado, body.report, userRole);
  }

  @Get(':id/chat')
  async getChatHistory(@Param('id') id: string, @Request() req) {
    const appointmentId = +id;
    const userRole = (req.user.rol || req.user.role)?.toLowerCase();
    const userId = req.user.userId;
    await this.chatsService.assertCanAccess(appointmentId, userId, userRole);
    return this.chatsService.getHistory(appointmentId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const cita = await this.service.findOne(+id);
    if (
      cita &&
      (req.user.rol === 'admin' || cita.usuario.id === req.user.userId)
    ) {
      return this.service.remove(+id);
    }
    return { message: 'No tienes permiso para eliminar esta cita' };
  }
}
