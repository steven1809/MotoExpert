import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  OneToOne,
  CreateDateColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Vehiculo } from '../../vehiculos/entities/vehiculo.entity';
import { Servicio } from '../../servicios/entities/servicio.entity';
import { Empleado } from '../../empleados/entities/empleado.entity';
import { Pago } from '../../pagos/entities/pago.entity';
import { Payment } from '../../pagos/entities/payment.entity';

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

  @Column({ type: 'timestamp', nullable: true })
  expected_end_time: Date;

  @Column({ default: 'PENDIENTE' })
  estado: string;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column('json', { nullable: true })
  report: {
    workPerformed: string;
    partsUsed?: string;
    observations?: string;
    condition: 'optimal' | 'attention' | 'urgent';
  };

  @Column({ default: false })
  rated: boolean;

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

  @OneToOne(() => Payment, (payment) => payment.appointment)
  payment: Payment;
}
