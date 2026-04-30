// src/usuarios/usuario.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Vehiculo } from '../modules/vehiculos/entities/vehiculo.entity';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true })
  documento: string;

  @Column({ nullable: true })
  nombre: string;

  @Column({ nullable: true })
  apellidos: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password?: string;

  @Column({ nullable: true })
  telefono: string;

  @Column({ default: 'usuario' }) 
  role: string;

  @OneToMany(() => Vehiculo, (vehiculo) => vehiculo.usuario)
  vehiculos: Vehiculo[];
}