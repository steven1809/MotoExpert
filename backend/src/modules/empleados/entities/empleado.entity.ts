import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Cita } from '../../citas/entities/cita.entity';

@Entity('empleados')
export class Empleado {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column()
  cargo: string;

  @Column()
  especialidad: string;

  @OneToMany(() => Cita, (cita) => cita.empleado)
  citas: Cita[];
}
