import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Cita } from './cita.entity';

@Entity('appointment_resolutions')
export class AppointmentResolution {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  appointment_id: number;

  @ManyToOne(() => Cita, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appointment_id' })
  cita: Cita;

  @Column({ type: 'int' })
  resolved_by: number;

  @Column({ type: 'varchar', length: 32 })
  resolution_type: string;

  @CreateDateColumn({ type: 'timestamp' })
  resolved_at: Date;
}
