import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateCitaDto {
  @IsString()
  @IsNotEmpty()
  fecha: string;

  @IsString()
  @IsNotEmpty()
  hora_inicio: string;

  @IsOptional()
  @IsString()
  hora_fin?: string;

  @IsOptional()
  @IsNumber()
  usuarioId?: number;

  @IsNumber()
  @IsNotEmpty()
  vehiculoId: number;

  @IsNumber()
  @IsNotEmpty()
  servicioId: number;

  @IsNumber()
  @IsOptional()
  empleadoId?: number;
}
