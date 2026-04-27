import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Vehiculo } from '../../vehiculos/entities/vehiculo.entity';
import { Servicio } from '../../servicios/entities/servicio.entity';
import { Empleado } from '../../empleados/entities/empleado.entity';
import { Pago } from '../../pagos/entities/pago.entity';

@Entity('citas')
export class Cita {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  fecha: string;

  @Column({ type: 'time' })
  hora_inicio: string;

  @Column({ type: 'time' })
  hora_fin: string;

  @Column({ default: 'PENDIENTE' })
  estado: string;

  @ManyToOne(() => Usuario, { eager: true })
  usuario: Usuario;

  @ManyToOne(() => Vehiculo, { eager: true })
  vehiculo: Vehiculo;

  @ManyToOne(() => Servicio, { eager: true })
  servicio: Servicio;

  @ManyToOne(() => Empleado, { eager: true })
  empleado: Empleado;

  @OneToMany(() => Pago, (pago) => pago.cita)
  pagos: Pago[];
}
