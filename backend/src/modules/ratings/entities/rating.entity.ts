import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Cita } from '../../citas/entities/cita.entity';
import { Empleado } from '../../empleados/entities/empleado.entity';

export type RatingStatus = 'VISIBLE' | 'HIDDEN' | 'DELETED';

@Entity('ratings')
export class Rating {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  specialistRating: number;

  @Column({ type: 'int' })
  serviceRating: number;

  @Column('text', { nullable: true })
  comment: string | null;

  @Column({
    type: 'enum',
    enum: ['VISIBLE', 'HIDDEN', 'DELETED'],
    default: 'VISIBLE'
  })
  status: RatingStatus;

  @ManyToOne(() => Usuario, { eager: true })
  usuario: Usuario;

  @ManyToOne(() => Cita, { eager: true, onDelete: 'CASCADE' })
  cita: Cita;

  @ManyToOne(() => Empleado, { eager: true })
  empleado: Empleado;

  @CreateDateColumn()
  createdAt: Date;
}
