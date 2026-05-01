import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateCitaDto {
  @IsString()
  @IsNotEmpty()
  fecha: string;

  @IsString()
  @IsNotEmpty()
  hora_inicio: string;

  @IsString()
  @IsNotEmpty()
  hora_fin: string;

  @IsNumber()
  @IsNotEmpty()
  usuarioId: number;

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
