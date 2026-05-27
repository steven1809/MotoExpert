import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Cita } from '../../citas/entities/cita.entity';

@Entity('vehiculos')
export class Vehiculo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  documentType: string;

  @Column({ nullable: true })
  documentNumber: string;

  @Column({ nullable: true })
  placa: string;

  @Column({ nullable: true })
  marca: string;

  @Column({ nullable: true })
  modelo: string;

  @Column({ nullable: true })
  tipo?: string;

  @Column({ nullable: true })
  anio?: number;

  @Column({ nullable: true })
  color?: string;

  @Column({ nullable: true })
  imagen?: string;

  @Column({ default: 'ACTIVO' })
  estado: string;

  @ManyToOne(() => Usuario, (usuario) => usuario.vehiculos, {
    onDelete: 'CASCADE',
  })
  usuario: Usuario;

  @OneToMany(() => Cita, (cita) => cita.vehiculo)
  citas: Cita[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
