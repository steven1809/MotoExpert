import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Cita } from '../../citas/entities/cita.entity';

@Entity('empleados')
export class Empleado {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true })
  documento: string;

  @Column({ default: 'activo' })
  estado: string; // activo o inactivo

  @Column({ nullable: true })
  cargo: string;

  @Column({ nullable: true })
  especialidad: string;

  @OneToMany(() => Cita, (cita) => cita.empleado)
  citas: Cita[];
}
