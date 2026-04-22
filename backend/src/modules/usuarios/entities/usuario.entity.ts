import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Vehiculo } from '../../vehiculos/entities/vehiculo.entity';
import { Cita } from '../../citas/entities/cita.entity';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  telefono: string;

  @OneToMany(() => Vehiculo, (vehiculo) => vehiculo.usuario)
  vehiculos: Vehiculo[];

  @OneToMany(() => Cita, (cita) => cita.usuario)
  citas: Cita[];
}
