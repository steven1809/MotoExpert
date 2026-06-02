import { IsString, IsNumber, IsOptional, IsNotEmpty, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCitaDto {
  @IsString()
  @IsNotEmpty({ message: 'La fecha es obligatoria' })
  fecha: string;

  @IsString()
  @IsNotEmpty({ message: 'La hora de inicio es obligatoria' })
  hora_inicio: string;

  @IsOptional()
  @IsString()
  hora_fin?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El ID de usuario debe ser un número' })
  @Type(() => Number)
  usuarioId?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El ID de vehículo debe ser un número' })
  @Type(() => Number)
  vehiculoId?: number;

  @IsNotEmpty({ message: 'El servicio es obligatorio' })
  @IsNumber({}, { message: 'El ID de servicio debe ser un número' })
  @Type(() => Number)
  servicioId: number;

  @IsOptional()
  @IsNumber({}, { message: 'El ID de empleado debe ser un número' })
  @Type(() => Number)
  empleadoId?: number;

  @IsOptional()
  @IsString()
  metodoPago?: string;

  @IsOptional()
  @IsBoolean()
  esGuest?: boolean; 

  @IsOptional()
  guestData?: {
    nombre: string;
    telefono: string;
    placa: string;
  };
}
