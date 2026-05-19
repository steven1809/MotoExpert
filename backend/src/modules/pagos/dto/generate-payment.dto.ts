import { IsBoolean, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { PaymentMethod } from '../enums/payment-method.enum';

export class GeneratePaymentDto {
  @IsInt()
  @Min(1)
  appointmentId: number;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsOptional()
  @IsBoolean()
  mockApproved?: boolean;
}
