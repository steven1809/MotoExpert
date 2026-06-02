import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Request,
  Delete,
  Patch,
} from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('ratings')
export class RatingsController {
  constructor(private readonly service: RatingsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(
    @Body()
    body: {
      citaId: number;
      specialistRating: number;
      serviceRating: number;
      comment?: string;
    },
    @Request() req,
  ) {
    return this.service.create(
      req.user,
      body.citaId,
      body.specialistRating,
      body.serviceRating,
      body.comment,
    );
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  findAll() {
    return this.service.findAllForAdmin();
  }

  @Get('public')
  findAllPublic() {
    return this.service.findAll();
  }

  @Get('cita/:citaId')
  findByCita(@Param('citaId') citaId: string) {
    return this.service.findByCita(+citaId);
  }

  @Get('empleado/:empleadoId')
  findByEmpleado(@Param('empleadoId') empleadoId: string) {
    return this.service.findByEmpleado(+empleadoId);
  }

  @Get('empleado/:empleadoId/stats')
  getEmpleadoStats(@Param('empleadoId') empleadoId: string) {
    return this.service.getEmpleadoStats(+empleadoId);
  }

  @Patch(':id/hide')
  @UseGuards(AuthGuard('jwt'))
  hideRating(@Param('id') id: string) {
    return this.service.hideRating(+id);
  }

  @Patch(':id/show')
  @UseGuards(AuthGuard('jwt'))
  showRating(@Param('id') id: string) {
    return this.service.showRating(+id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
