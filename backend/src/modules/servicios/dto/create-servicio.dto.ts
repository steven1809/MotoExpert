import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';

export class CreateServicioDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @IsNumber()
  @Min(0)
  precio: number;

  @IsNumber()
  @Min(1)
  duracion: number; // en minutos
}
