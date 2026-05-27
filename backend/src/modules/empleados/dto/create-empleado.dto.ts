import { IsString, IsNotEmpty, IsOptional, IsIn, IsNumber } from 'class-validator';

export class CreateEmpleadoDto {
  @IsNumber()
  @IsNotEmpty()
  usuarioId: number;

  @IsString()
  @IsOptional()
  documentNumber?: string;

  @IsString()
  @IsOptional()
  documentType?: string;

  @IsString()
  @IsOptional()
  @IsIn(['activo', 'inactivo'])
  estado?: string;

  @IsString()
  @IsOptional()
  cargo?: string;

  @IsString()
  @IsOptional()
  especialidad?: string;

  @IsString()
  @IsOptional()
  fechaIngreso?: string;
}
