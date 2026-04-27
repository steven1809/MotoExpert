export class CreateVehiculoDto {
  placa: string;
  marca: string;
  modelo: string;
  tipo?: string;
  anio?: number;
  usuarioId: number;
}
