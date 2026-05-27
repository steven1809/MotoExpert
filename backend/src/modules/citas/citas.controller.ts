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
  SetMetadata,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CitasService } from './citas.service';
import { CreateCitaDto } from './dto/create-cita.dto';
import { AuthGuard } from '@nestjs/passport';
import { AppointmentChatsService } from './appointment-chats.service';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// Decorador para rutas públicas
export const Public = () => SetMetadata('isPublic', true);

// Guard personalizado que respeta @Public()
@Injectable()
export class JwtAuthGuardPublic extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }
}

@Controller('citas')
@UseGuards(JwtAuthGuardPublic)
export class CitasController {
  constructor(
    private readonly service: CitasService,
    private readonly chatsService: AppointmentChatsService,
  ) {}

  @Public()
  @Post()
  create(@Body() dto: CreateCitaDto, @Request() req) {
    console.log('[DEBUG] Recibiendo DTO para crear cita:', dto);
    // Si hay usuario en el request (JWT válido), lo usamos. Si no, dejamos que el service maneje el guest.
    const finalDto = { ...dto };
    if (req.user && req.user.userId) {
      finalDto.usuarioId = req.user.userId;
    }
    console.log('[DEBUG] DTO Final para service:', finalDto);
    return this.service.create(finalDto);
  }
  @Get()
  findAll(
    @Request() req,
    @Query('userId') userId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('estado') estado?: string,
  ) {
    const userRole = (req.user.rol || req.user.role)?.toLowerCase();
    const p = page ? parseInt(page) : 1;
    const l = limit ? parseInt(limit) : 10;

    // ADMIN VE TODO
    if (userRole === 'admin') {
      return this.service.findAll(
        userId ? +userId : undefined,
        userRole,
        p,
        l,
        estado,
      );
    }

    // EMPLEADO VE SUS CITAS
    if (userRole === 'empleado' || userRole === 'trabajador') {
      return this.service.findAll(req.user.userId, 'empleado', p, l, estado);
    }

    // USUARIO NORMAL
    return this.service.findAll(req.user.userId, 'usuario', p, l, estado);
  }

  @Public()
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

  @Patch(':id/reschedule')
  reschedule(
    @Param('id') id: string,
    @Body('fecha') fecha: string,
    @Body('hora_inicio') hora_inicio: string,
  ) {
    return this.service.reschedule(+id, fecha, hora_inicio);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Body('motivo') motivo: string, @Request() req) {
    const cita = await this.service.findOne(+id);
    if (!cita) throw new NotFoundException('Cita no encontrada');
    
    const userRole = (req.user.rol || req.user.role)?.toLowerCase();
    // Solo admin puede forzar eliminar desde este nuevo flujo
    if (userRole !== 'admin') {
      throw new ForbiddenException('No tienes permisos para eliminar citas permanentemente');
    }

    return this.service.remove(+id, motivo);
  }
}
