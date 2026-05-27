import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  ParseIntPipe,
  Query,
  SetMetadata,
} from '@nestjs/common';
import { ServiciosService } from './servicios.service';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';

// Definimos un decorador simple para marcar rutas como públicas
export const Public = () => SetMetadata('isPublic', true);

@Controller('servicios')
export class ServiciosController {
  constructor(private readonly service: ServiciosService) {}

  @Public()
  @Get()
  async getAll(@Query() filtros: any) {
    const result = await this.service.findAll(filtros);
    console.log('Servicios encontrados:', result.data.length, 'de', result.total);
    return result;
  }

  @Public()
  @Get('list')
  async getPublicList() {
    return this.service.findPublicList();
  }

  @Get(':id')
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() body: CreateServicioDto) {
    return this.service.create(body);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateServicioDto,
  ) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.service.delete(id);
  }
}
