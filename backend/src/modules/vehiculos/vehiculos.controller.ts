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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { VehiculosService } from './vehiculos.service';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('vehiculos')
@UseGuards(AuthGuard('jwt'))
export class VehiculosController {
  constructor(private readonly service: VehiculosService) {}

  @Post()
  create(@Body() dto: CreateVehiculoDto, @Request() req) {
    const userRole = (req.user.rol || req.user.role)?.toLowerCase();
    
    // Si es admin y se proporciona un usuarioId, usar ese.
    // De lo contrario, usar el del usuario autenticado.
    const finalUserId = (userRole === 'admin' && dto.usuarioId) 
      ? dto.usuarioId 
      : req.user.userId;
      
    return this.service.create({ ...dto, usuarioId: finalUserId });
  }

  @Post(':id/upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/vehicles',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  uploadImage(@Param('id') id: string, @UploadedFile() file: any) {
    const photoUrl = `http://localhost:3001/uploads/vehicles/${file.filename}`;
    return this.service.update(+id, { imagen: photoUrl });
  }

  @Get('placa/:placa')
  findByPlaca(@Param('placa') placa: string) {
    return this.service.findByPlaca(placa);
  }

  @Get()
  findAll(@Request() req, @Query('userId') userId?: string) {
    const userRole = (req.user.rol || req.user.role)?.toLowerCase();

    // Si es admin o empleado puede ver todos los vehículos o filtrar por usuario
    if (
      userRole === 'admin' ||
      userRole === 'empleado' ||
      userRole === 'trabajador'
    ) {
      if (userId) {
        return this.service.findAll(+userId);
      }
      return this.service.findAll();
    }
    // Si no es admin o empleado, solo devolvemos los suyos (el service ya maneja el filtro)
    return this.service.findAll(req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const userRole = (req.user.rol || req.user.role)?.toLowerCase();
    const vehiculo = await this.service.findOne(+id);
    // Verificamos que el vehículo pertenezca al usuario o sea admin/empleado
    if (
      vehiculo &&
      (userRole === 'admin' ||
        userRole === 'empleado' ||
        userRole === 'trabajador' ||
        vehiculo.usuario.id === req.user.userId)
    ) {
      return vehiculo;
    }
    return null;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateData: any,
    @Request() req,
  ) {
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
