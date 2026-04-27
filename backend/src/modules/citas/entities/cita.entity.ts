import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Vehiculo } from '../../vehiculos/entities/vehiculo.entity';
import { Empleado } from '../../empleados/entities/empleado.entity';
import { Pago } from '../../pagos/entities/pago.entity';

@Entity('citas')
export class Cita {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  fecha: Date;

  @Column({ type: 'time' })
  hora: string;

  @Column({ default: 'pendiente' })
  estado: string;

  @ManyToOne(() => Usuario, (usuario) => usuario.citas)
  usuario: Usuario;

  @ManyToOne(() => Vehiculo, (vehiculo) => vehiculo.citas)
  vehiculo: Vehiculo;

  @ManyToOne(() => Empleado, (empleado) => empleado.citas)
  empleado: Empleado;

  @OneToMany(() => Pago, (pago) => pago.cita)
  pagos: Pago[];
}
