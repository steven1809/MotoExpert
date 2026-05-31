import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceStage, StageType } from './entities/service-stage.entity';
import { Cita } from '../citas/entities/cita.entity';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { ServiceStagesGateway } from './service-stages.gateway';

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
    @InjectRepository(Cita)
    private readonly citaRepo: Repository<Cita>,
    private readonly notificacionesService: NotificacionesService,
    private readonly gateway: ServiceStagesGateway,
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

  async getCurrentStatus(citaId: number) {
    const stages = await this.getStagesByCita(citaId);
    const payload = this.buildServiceUpdatedPayload(citaId, stages);
    return { ...payload, stages };
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

    const prevCompleted = found.completed;
    const prevImagesLen = Array.isArray(found.images) ? found.images.length : 0;

    // EN_PROCESO acumula updates en lugar de reemplazarlos
    if (stage === StageType.EN_PROCESO && body.updates?.length) {
      found.updates = [...found.updates, ...body.updates];
    }

    if (body.observation !== undefined) found.observation = body.observation;
    if (body.images !== undefined)      found.images = body.images;
    if (body.completed !== undefined)   found.completed = body.completed;

    const saved = await this.stageRepo.save(found);
    const stagesAfter = await this.getStagesByCita(citaId);
    this.gateway.emitServiceUpdated(
      citaId,
      this.buildServiceUpdatedPayload(citaId, stagesAfter),
    );

    const cita = await this.citaRepo.findOne({
      where: { id: citaId },
      relations: ['usuario', 'vehiculo', 'servicio'],
    });
    if (cita?.usuario?.id) {
      const clienteUserId = cita.usuario.id;

      if (body.images !== undefined) {
        const newLen = Array.isArray(body.images) ? body.images.length : 0;
        if (newLen > prevImagesLen) {
          const stageLabel = this.stageLabel(stage);
          await this.notificacionesService.create(
            cita.usuario,
            'service_tracking_content',
            'Nuevo contenido en tu servicio',
            `El taller subió nuevo contenido en tu servicio: ${stageLabel}`,
          );
          this.gateway.emitServiceTrackingNotification(clienteUserId, {
            appointmentId: citaId,
            title: 'Nuevo contenido en tu servicio',
            type: 'service_tracking_content',
            message: `El taller subió nuevo contenido en tu servicio: ${stageLabel}`,
          });
        }
      }

      if (body.completed === true && !prevCompleted) {
        const nextStage = STAGE_ORDER[stageIndex + 1];
        const nextLabel = this.stageLabel(nextStage ?? stage);
        await this.notificacionesService.create(
          cita.usuario,
          'service_tracking_stage_advanced',
          'Avance de tu servicio',
          `Tu servicio avanzó a la etapa: ${nextLabel}`,
        );
        this.gateway.emitServiceTrackingNotification(clienteUserId, {
          appointmentId: citaId,
          title: 'Avance de tu servicio',
          type: 'service_tracking_stage_advanced',
          message: `Tu servicio avanzó a la etapa: ${nextLabel}`,
        });

        if (stage === StageType.FINALIZADO) {
          await this.notificacionesService.create(
            cita.usuario,
            'service_tracking_finished',
            'Servicio finalizado',
            'Tu servicio ha sido finalizado. ¡Gracias por confiar en MotoExpert!',
          );
          this.gateway.emitServiceTrackingNotification(clienteUserId, {
            appointmentId: citaId,
            title: 'Servicio finalizado',
            type: 'service_tracking_finished',
            message:
              'Tu servicio ha sido finalizado. ¡Gracias por confiar en MotoExpert!',
          });
        }
      }

      this.gateway.emitStageUpdated(citaId, clienteUserId, saved);
    }

    return saved;
  }

  private buildServiceUpdatedPayload(citaId: number, stages: ServiceStage[]) {
    const totalStages = STAGE_ORDER.length;
    const byStage = new Map<StageType, ServiceStage>();
    stages.forEach((s) => byStage.set(s.stage, s));

    const completedCount = STAGE_ORDER.reduce((acc, t) => {
      const st = byStage.get(t);
      return acc + (st?.completed ? 1 : 0);
    }, 0);

    const currentStage =
      completedCount >= totalStages
        ? StageType.FINALIZADO
        : STAGE_ORDER[Math.min(completedCount, totalStages - 1)];

    const current = byStage.get(currentStage) || null;
    const updatedAtIso =
      current?.updatedAt instanceof Date
        ? current.updatedAt.toISOString()
        : typeof current?.updatedAt === 'string'
          ? current.updatedAt
          : new Date().toISOString();

    const { notes, images, videos } = this.contentFromStage(currentStage, current);

    return {
      appointmentId: citaId,
      currentStage,
      progress: completedCount,
      totalStages,
      updatedAt: updatedAtIso,
      content: { notes, images, videos },
    };
  }

  private contentFromStage(stage: StageType, current: ServiceStage | null) {
    const rawImages = Array.isArray(current?.images) ? current!.images : [];
    const images: string[] = [];
    const videos: string[] = [];

    rawImages.forEach((u) => {
      const v = String(u || '');
      if (!v) return;
      if (v.startsWith('data:video/')) videos.push(v);
      else images.push(v);
    });

    let notes = current?.observation ? String(current.observation) : '';
    if (!notes && stage === StageType.EN_PROCESO) {
      const updates = Array.isArray(current?.updates) ? current!.updates : [];
      notes = updates
        .map((u: any) => String(u?.text || '').trim())
        .filter(Boolean)
        .join('\n');
    }

    return { notes, images, videos };
  }

  private stageLabel(stage: StageType) {
    if (stage === StageType.RECEPCION) return 'Recepción';
    if (stage === StageType.DIAGNOSTICO) return 'Diagnóstico';
    if (stage === StageType.EN_PROCESO) return 'En Proceso';
    return 'Finalizado';
  }
}
