import { Controller, Post, Body, Get, Param, Delete, UseGuards, Request,Query, Patch } from '@nestjs/common';
import { VehiculosService } from './vehiculos.service';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('vehiculos')
@UseGuards(AuthGuard('jwt'))
export class VehiculosController {
  constructor(private readonly service: VehiculosService) {}

  @Post()
  create(@Body() dto: CreateVehiculoDto, @Request() req) {
    // Aseguramos que el vehículo se cree para el usuario autenticado
    return this.service.create({ ...dto, usuarioId: req.user.userId });
  }

  @Get()
  findAll(@Request() req, @Query('userId') userId?: string) {
    // Si es admin y se proporciona un userId, filtramos por ese ID
    if (req.user.rol === 'admin') {
      if (userId) {
        return this.service.findAll(+userId);
      }
      return this.service.findAll();
    }
    // Si no es admin, solo devolvemos los suyos (el service ya maneja el filtro)
    return this.service.findAll(req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const vehiculo = await this.service.findOne(+id);
    // Verificamos que el vehículo pertenezca al usuario o sea admin
    if (vehiculo && req.user.rol !== 'admin' && vehiculo.usuario.id !== req.user.userId) {
      return null;
    }
    return vehiculo;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateData: any, @Request() req) {
    const vehiculo = await this.service.findOne(+id);
    if (vehiculo && vehiculo.usuario.id === req.user.userId) {
      return this.service.update(+id, updateData);
    }
    return { message: 'No tienes permiso para actualizar este vehículo' };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const vehiculo = await this.service.findOne(+id);
    if (vehiculo && vehiculo.usuario.id === req.user.userId) {
      return this.service.remove(+id);
    }
    return { message: 'No tienes permiso para eliminar este vehículo' };
  }
}
