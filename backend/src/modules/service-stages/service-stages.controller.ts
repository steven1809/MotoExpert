import { Controller, Get, Patch, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ServiceStagesService } from './service-stages.service';
import { StageType } from './entities/service-stage.entity';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'; 

@Controller('citas/:citaId/stages')
@UseGuards(JwtAuthGuard)
export class ServiceStagesController {
  constructor(private readonly service: ServiceStagesService) {}

  // GET /citas/:citaId/stages — cliente y empleado
  @Get()
  getStages(@Param('citaId', ParseIntPipe) citaId: number) {
    return this.service.getStagesByCita(citaId);
  }

  // PATCH /citas/:citaId/stages/init — empleado inicia el servicio
  @Patch('init')
  initStages(@Param('citaId', ParseIntPipe) citaId: number) {
    return this.service.initStages(citaId);
  }

  // PATCH /citas/:citaId/stages/:stage — empleado actualiza una etapa
  @Patch(':stage')
  updateStage(
    @Param('citaId', ParseIntPipe) citaId: number,
    @Param('stage') stage: StageType,
    @Body() body: {
      observation?: string;
      images?: string[];
      updates?: { text: string; timestamp: string }[];
      completed?: boolean;
    },
  ) {
    return this.service.updateStage(citaId, stage, body);
  }
}