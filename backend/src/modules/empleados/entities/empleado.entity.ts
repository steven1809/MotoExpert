import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Cita } from '../../citas/entities/cita.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity('empleados')
export class Empleado {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true })
  documentNumber: string;

  @Column({ nullable: true })
  documentType: string;

  @Column({ default: 'activo' })
  estado: string; // activo o inactivo

  @Column({ nullable: true })
  cargo: string;

  @Column({ nullable: true })
  especialidad: string;

  @Column({ nullable: true })
  fechaIngreso: string;

  @OneToOne(() => Usuario)
  @JoinColumn({ name: 'usuarioId' })
  usuario: Usuario;

  @Column({ nullable: true })
  usuarioId: number;

  @Column({ type: 'json', nullable: true })
  horarioConfig: {
    lunesViernes: { inicio: string; fin: string };
    sabado: { inicio: string; fin: string };
    domingo?: { inicio: string; fin: string };
  };

  @OneToMany(() => Cita, (cita) => cita.empleado)
  citas: Cita[];
}
