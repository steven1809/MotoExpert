import { Controller, Post, Body, Get, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { CitasService } from './citas.service';
import { CreateCitaDto } from './dto/create-cita.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('citas')
@UseGuards(AuthGuard('jwt'))
export class CitasController {
  constructor(private readonly service: CitasService) {}

  @Post()
  create(@Body() dto: CreateCitaDto, @Request() req) {
    // Forzamos que la cita sea para el usuario autenticado
    return this.service.create({ ...dto, usuarioId: req.user.userId });
  }

  @Get()
  findAll(@Request() req, @Query('userId') userId?: string) {
    // Si es admin puede ver todas o filtrar por un usuario específico
    if (req.user.rol === 'admin') {
      if (userId) {
        return this.service.findAll(+userId);
      }
      return this.service.findAll();
    }
    // Si no es admin, solo devolvemos las suyas
    return this.service.findAll(req.user.userId);
  }

  @Get('disponibilidad')
  checkAvailability(
    @Query('fecha') fecha: string,
    @Query('servicioId') servicioId: string
  ) {
    return this.service.getAvailableSlots(fecha, +servicioId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const cita = await this.service.findOne(+id);
    if (cita && req.user.rol !== 'admin' && cita.usuario.id !== req.user.userId) {
      return null;
    }
    return cita;
  }

  @Patch(':id/estado')
  updateEstado(@Param('id') id: string, @Body('estado') estado: string) {
    return this.service.updateEstado(+id, estado);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const cita = await this.service.findOne(+id);
    if (cita && (req.user.rol === 'admin' || cita.usuario.id === req.user.userId)) {
      return this.service.remove(+id);
    }
    return { message: 'No tienes permiso para eliminar esta cita' };
  }
}
