import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cita } from '../citas/entities/cita.entity';
import { Pago } from './entities/pago.entity';
import { Payment } from './entities/payment.entity';
import { EmpleadoRoleGuard, PaymentController, UsuarioRoleGuard } from './payment.controller';
import { PaymentService } from './payment.service';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [TypeOrmModule.forFeature([Pago, Payment, Cita]), ActivityModule, ConfigModule],
  controllers: [PaymentController],
  providers: [PaymentService, UsuarioRoleGuard, EmpleadoRoleGuard],
  exports: [TypeOrmModule, PaymentService],
})
export class PagosModule {}
