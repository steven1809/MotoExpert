import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Cita } from '../../citas/entities/cita.entity';

@Entity('vehiculos')
export class Vehiculo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  placa: string;

  @Column()
  marca: string;

  @Column()
  modelo: string;

  @Column()
  anio: number;

  @Column()
  color: string;

  @ManyToOne(() => Usuario, (usuario) => usuario.vehiculos)
  usuario: Usuario;

  @OneToMany(() => Cita, (cita) => cita.vehiculo)
  citas: Cita[];
}
