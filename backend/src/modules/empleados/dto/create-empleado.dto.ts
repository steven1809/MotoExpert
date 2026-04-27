import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreateEmpleadoDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  documento: string;

  @IsString()
  @IsOptional()
  @IsIn(['activo', 'inactivo'])
  estado?: string;

  @IsString()
  @IsOptional()
  cargo?: string;
}
