import { IsString, IsOptional } from 'class-validator';

export class UpdateEmpleadoDto {
  @IsString()
  @IsOptional()
  cargo?: string;

  @IsString()
  @IsOptional()
  especialidad?: string;

  @IsString()
  @IsOptional()
  estado?: string;

  @IsString()
  @IsOptional()
  documentType?: string;

  @IsString()
  @IsOptional()
  documentNumber?: string;

  @IsString()
  @IsOptional()
  fechaIngreso?: string;
}
