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

  @ManyToOne(() => Usuario, { eager: true })
  usuario: Usuario;

  @ManyToOne(() => Cita, { eager: true })
  cita: Cita;

  @ManyToOne(() => Empleado, { eager: true })
  empleado: Empleado;

  @CreateDateColumn()
  createdAt: Date;
}
