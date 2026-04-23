import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Cita } from '../../citas/entities/cita.entity';

@Entity('vehiculos')
export class Vehiculo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  placa: string;

  @Column({ nullable: true })
  marca: string;

  @Column({ nullable: true })
  modelo: string;

  @Column({ nullable: true })
  anio: number;

  @Column({ nullable: true })
  color: string;

  @ManyToOne(() => Usuario, (usuario) => usuario.vehiculos)
  usuario: Usuario;

  @OneToMany(() => Cita, (cita) => cita.vehiculo)
  citas: Cita[];
}
