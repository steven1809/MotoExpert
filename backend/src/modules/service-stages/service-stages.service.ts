import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceStage, StageType } from './entities/service-stage.entity';

const STAGE_ORDER: StageType[] = [
  StageType.RECEPCION,
  StageType.DIAGNOSTICO,
  StageType.EN_PROCESO,
  StageType.FINALIZADO,
];

@Injectable()
export class ServiceStagesService {
  constructor(
    @InjectRepository(ServiceStage)
    private readonly stageRepo: Repository<ServiceStage>,
  ) {}

  async initStages(citaId: number): Promise<ServiceStage[]> {
    const existing = await this.stageRepo.find({
      where: { cita: { id: citaId } },
    });
    if (existing.length > 0) return existing;

    const stages = STAGE_ORDER.map((stageType) =>
      this.stageRepo.create({
        cita: { id: citaId },
        stage: stageType,
        images: [],
        updates: [],
        completed: false,
      }),
    );
    return this.stageRepo.save(stages);
  }

  async getStagesByCita(citaId: number): Promise<ServiceStage[]> {
    return this.stageRepo.find({
      where: { cita: { id: citaId } },
      order: { createdAt: 'ASC' },
    });
  }

  async updateStage(
    citaId: number,
    stage: StageType,
    body: {
      observation?: string;
      images?: string[];
      updates?: { text: string; timestamp: string }[];
      completed?: boolean;
    },
  ): Promise<ServiceStage> {
    const stages = await this.getStagesByCita(citaId);
    const stageIndex = STAGE_ORDER.indexOf(stage);

    // Validar orden secuencial
    if (stageIndex > 0) {
      const prev = stages.find((s) => s.stage === STAGE_ORDER[stageIndex - 1]);
      if (!prev?.completed) {
        throw new ForbiddenException(
          `Debes completar primero: ${STAGE_ORDER[stageIndex - 1]}`,
        );
      }
    }

    const found = stages.find((s) => s.stage === stage);
    if (!found) throw new NotFoundException(`Etapa ${stage} no encontrada`);

    // EN_PROCESO acumula updates en lugar de reemplazarlos
    if (stage === StageType.EN_PROCESO && body.updates?.length) {
      found.updates = [...found.updates, ...body.updates];
    }

    if (body.observation !== undefined) found.observation = body.observation;
    if (body.images !== undefined)      found.images = body.images;
    if (body.completed !== undefined)   found.completed = body.completed;

    return this.stageRepo.save(found);
  }
}