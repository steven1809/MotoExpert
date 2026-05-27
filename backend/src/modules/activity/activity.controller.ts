import { Controller, Get, Query, SetMetadata } from '@nestjs/common';
import { ActivityService } from './activity.service';

export const Public = () => SetMetadata('isPublic', true);

@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  async getActivities(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('entityType') entityType?: string,
  ) {
    return this.activityService.findAll(Number(page), Number(limit), entityType);
  }
}
