import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Cita } from '../../citas/entities/cita.entity';

@Entity('pagos')
export class Pago {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', { precision: 10, scale: 2 })
  monto: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha: Date;

  @Column()
  metodoPago: string;

  @ManyToOne(() => Cita, (cita) => cita.pagos)
  cita: Cita;
}
