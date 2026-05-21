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
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { VehiculosService } from './vehiculos.service';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';

@Controller('vehiculos')
@UseGuards(AuthGuard('jwt'))
export class VehiculosController {
  constructor(private readonly service: VehiculosService) {}

  @Post()
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
  create(
    @Body() dto: CreateVehiculoDto,
    @Request() req,
    @UploadedFile() file?: any,
  ) {
    const userRole = (req.user.rol || req.user.role)?.toLowerCase();

    // Si es admin y se proporciona un usuarioId, usar ese.
    // De lo contrario, usar el del usuario autenticado.
    const finalUserId =
      userRole === 'admin' && dto.usuarioId ? dto.usuarioId : req.user.userId;

    const vehicleData = { ...dto, usuarioId: finalUserId };

    if (file) {
      vehicleData.imagen = `http://localhost:3001/uploads/vehicles/${file.filename}`;
    }

    return this.service.create(vehicleData);
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
    // Si no es admin o empleado, solo devolvemos los suyos
    return this.service.findAll(req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const userRole = (req.user.rol || req.user.role)?.toLowerCase();
    const vehiculo = await this.service.findOne(+id);

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
  async update(
    @Param('id') id: string,
    @Body() updateData: any,
    @Request() req,
    @UploadedFile() file?: any,
  ) {
    try {
      const userRole = (req.user.rol || req.user.role)?.toLowerCase();
      const vehiculo = await this.service.findOne(+id);

      if (!vehiculo) {
        throw new NotFoundException('Vehículo no encontrado');
      }

      // Comparación segura de IDs (convertir ambos a String)
      if (
        userRole !== 'admin' &&
        String(vehiculo.usuario.id) !== String(req.user.userId)
      ) {
        throw new ForbiddenException(
          'No tienes permiso para actualizar este vehículo',
        );
      }

      // Construir objeto de actualización con campos permitidos
      const finalUpdateData: any = {};
      const allowedFields = [
        'placa',
        'marca',
        'modelo',
        'tipo',
        'anio',
        'color',
      ];

      allowedFields.forEach((field) => {
        if (updateData[field] !== undefined && updateData[field] !== 'null') {
          if (field === 'anio') {
            const anioVal = parseInt(updateData[field], 10);
            finalUpdateData[field] = isNaN(anioVal) ? null : anioVal;
          } else {
            finalUpdateData[field] = updateData[field];
          }
        }
      });

      // Solo si el usuario subió una foto nueva
      if (file) {
        // Borrar imagen anterior del disco si existe
        if (
          vehiculo.imagen &&
          vehiculo.imagen.includes('http://localhost:3001/uploads/vehicles/')
        ) {
          const oldFilename = vehiculo.imagen.split('/').pop();
          const oldPath = join(
            process.cwd(),
            'uploads',
            'vehicles',
            oldFilename || '',
          );
          if (fs.existsSync(oldPath)) {
            try {
              fs.unlinkSync(oldPath);
            } catch (err) {
              console.error('Error al eliminar imagen antigua:', err);
            }
          }
        }
        finalUpdateData.imagen = `http://localhost:3001/uploads/vehicles/${file.filename}`;
      }

      return await this.service.update(+id, finalUpdateData);
    } catch (error) {
      console.error('❌ ERROR CRÍTICO EN EL BACKEND:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException({
        message: 'Error interno del servidor',
        error: error.message,
      });
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    console.log(`[VehiculosController] Petición DELETE para ID: ${id} por usuario: ${req.user.userId}`);
    
    try {
      const userRole = (req.user.rol || req.user.role)?.toLowerCase();
      
      // Buscamos el vehículo sin filtrar por estado para verificar existencia real
      const vehiculo = await this.service.findOne(+id);
      
      if (!vehiculo) {
        throw new NotFoundException(`Vehículo con ID ${id} no encontrado.`);
      }

      // Validación de permisos: Admin o dueño
      if (userRole !== 'admin' && vehiculo.usuario.id !== req.user.userId) {
        console.warn(`[VehiculosController] Usuario ${req.user.userId} intentó eliminar vehículo ajeno ${id}`);
        throw new ForbiddenException('No tienes permisos para eliminar este vehículo.');
      }

      return await this.service.remove(+id);
    } catch (error) {
      console.error(`[VehiculosController] Error al eliminar vehículo ${id}:`, error.message);
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException({
        message: 'Ocurrió un error inesperado al eliminar el vehículo.',
        error: error.message
      });
    }
  }
}