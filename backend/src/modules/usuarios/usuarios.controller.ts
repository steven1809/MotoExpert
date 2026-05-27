import { Controller, Get, Patch, Body, Param, UseGuards, Post, UseInterceptors, UploadedFile, ForbiddenException, SetMetadata } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Request } from 'express';
import { Req } from '@nestjs/common';

// Definimos un decorador simple para marcar rutas como públicas
const Public = () => SetMetadata('isPublic', true);

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Public()
  @Get('empleados')
  findEmployees() {
    return this.usuariosService.findEmployees();
  }

  @Get()
  findAll() {
    return this.usuariosService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Req() req: any) {
    return this.usuariosService.findOne(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateData: any, @Req() req: any) {
    // Si se intenta actualizar el rol, validar que el usuario que hace la petición sea admin
    if (updateData.role && req.user.role !== 'admin') {
      throw new ForbiddenException('Solo los administradores pueden cambiar roles de usuario');
    }
    return this.usuariosService.update(+id, updateData);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/upload-photo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/profiles',
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
  uploadPhoto(@Param('id') id: string, @UploadedFile() file: any) {
    const photoUrl = `http://localhost:3001/uploads/profiles/${file.filename}`;
    return this.usuariosService.update(+id, { picture: photoUrl });
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/upload-banner')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/banners',
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
  uploadBanner(@Param('id') id: string, @UploadedFile() file: any) {
    const bannerUrl = `http://localhost:3001/uploads/banners/${file.filename}`;
    return this.usuariosService.update(+id, { banner: bannerUrl });
  }
}
