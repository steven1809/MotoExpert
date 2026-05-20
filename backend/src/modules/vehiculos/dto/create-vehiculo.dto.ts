import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';

import { Type } from 'class-transformer';

export class CreateVehiculoDto {
  @IsNotEmpty({ message: 'La placa es requerida' })
  @IsString({ message: 'La placa debe ser un texto' })
  placa: string;

  @IsNotEmpty({ message: 'La marca es requerida' })
  @IsString({ message: 'La marca debe ser un texto' })
  marca: string;

  @IsNotEmpty({ message: 'El modelo es requerido' })
  @IsString({ message: 'El modelo debe ser un texto' })
  modelo: string;

  @IsOptional()
  @IsString({ message: 'El tipo debe ser un texto' })
  tipo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El año debe ser un número' })
  @Min(1900, { message: 'El año debe ser mayor a 1900' })
  anio?: number;

  @IsOptional()
  @IsString({ message: 'El color debe ser un texto' })
  color?: string;

  @IsOptional()
  @IsString({ message: 'La imagen debe ser un texto' })
  imagen?: string;

  @IsNotEmpty({ message: 'El ID del usuario es requerido' })
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del usuario debe ser un número' })
  usuarioId: number;
}