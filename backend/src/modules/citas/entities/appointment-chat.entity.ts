import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Cita } from './cita.entity';

@Entity('appointment_chats')
export class AppointmentChat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  appointment_id: number;

  @ManyToOne(() => Cita, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appointment_id' })
  cita: Cita;

  @Column({ type: 'int' })
  sender_id: number;

  @Column({ type: 'varchar', length: 32 })
  sender_role: string;

  @Column({ type: 'text' })
  message: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
