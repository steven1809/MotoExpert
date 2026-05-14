import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Vehiculo } from '../../vehiculos/entities/vehiculo.entity';
import { Cita } from '../../citas/entities/cita.entity';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  nombre?: string;

  @Column({ nullable: true })
  apellidos?: string;

  @Column({ unique: true, nullable: true })
  email?: string;

  @Column({
    unique: true,
    nullable: true,
  })
  documento?: string;

  @Column({ nullable: true })
  password?: string;

  @Column({ nullable: true })
  telefono?: string;

  @Column({ default: 'cliente' })
  role: string;

  @Column({ nullable: true, unique: true })
  googleId?: string;

  @Column({ nullable: true })
  picture?: string;

  @Column({ default: 'local' })
  provider: string;

  @OneToMany(() => Vehiculo, (vehiculo) => vehiculo.usuario)
  vehiculos: Vehiculo[];

  @OneToMany(() => Cita, (cita) => cita.usuario)
  citas: Cita[];
}
