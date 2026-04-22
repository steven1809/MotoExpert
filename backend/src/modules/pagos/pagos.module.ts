import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pago } from './entities/pago.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pago])],
  exports: [TypeOrmModule],
})
export class PagosModule {}
