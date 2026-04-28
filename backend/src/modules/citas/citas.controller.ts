import { Controller, Post, Body, Get, Param, Delete } from '@nestjs/common';
import { CitasService } from './citas.service';
import { CreateCitaDto } from './dto/create-cita.dto';

@Controller('citas')
export class CitasController {
  constructor(private readonly service: CitasService) {}

  @Post()
  create(@Body() dto: CreateCitaDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
