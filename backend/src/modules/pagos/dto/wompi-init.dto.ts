import { IsInt, IsPositive } from 'class-validator';

export class WompiInitDto {
  @IsInt()
  @IsPositive()
  appointmentId: number;
}