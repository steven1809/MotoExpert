import { Controller, Get, Patch, Body, Param, UseGuards, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  findAll() {
    return this.usuariosService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateData: any) {
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
    const photoUrl = `http://localhost:3000/uploads/profiles/${file.filename}`;
    return this.usuariosService.update(+id, { picture: photoUrl });
  }
}
