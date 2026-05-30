import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, CreateDateColumn, UpdateDateColumn
} from 'typeorm';
import { Cita } from '../../citas/entities/cita.entity';

export enum StageType {
  RECEPCION   = 'RECEPCION',
  DIAGNOSTICO = 'DIAGNOSTICO',
  EN_PROCESO  = 'EN_PROCESO',
  FINALIZADO  = 'FINALIZADO',
}

@Entity('service_stages')
export class ServiceStage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Cita, { onDelete: 'CASCADE' })
  cita: Cita;

  @Column({ type: 'enum', enum: StageType })
  stage: StageType;

  @Column({ type: 'text', nullable: true })
  observation: string;

  @Column({ type: 'text', array: true, default: '{}' })
  images: string[];

  @Column({ type: 'jsonb', default: '[]' })
  updates: { text: string; timestamp: string }[];

  @Column({ default: false })
  completed: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}