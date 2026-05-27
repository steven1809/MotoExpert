import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from './entities/activity-log.entity';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityRepo: Repository<ActivityLog>,
  ) {}

  async logActivity(
    action: string,
    description: string,
    entityType: string,
    entityId: string,
    performedBy: string,
    performedByRole: string = 'sistema',
  ): Promise<ActivityLog> {
    const log = this.activityRepo.create({
      action,
      description,
      entityType,
      entityId,
      performedBy,
      performedByRole,
    });
    return this.activityRepo.save(log);
  }

  async findAll(page = 1, limit = 10, entityType?: string) {
    const qb = this.activityRepo.createQueryBuilder('log');

    if (entityType && entityType !== 'TODOS') {
      qb.andWhere('log.entityType = :entityType', { entityType: entityType.toLowerCase() });
    }

    qb.orderBy('log.createdAt', 'DESC');

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
