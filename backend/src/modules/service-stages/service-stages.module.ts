import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceStage } from './entities/service-stage.entity';
import { ServiceStagesService } from './service-stages.service';
import { ServiceStagesController } from './service-stages.controller';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceStage]),
    AuthModule,
  ],
  providers: [ServiceStagesService],
  controllers: [ServiceStagesController],
  exports: [ServiceStagesService],
})
export class ServiceStagesModule {}