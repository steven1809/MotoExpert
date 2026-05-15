import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity('notificaciones')
export class Notificacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tipo: string;

  @Column()
  titulo: string;

  @Column('text')
  mensaje: string;

  @Column({ default: false })
  leida: boolean;

  @ManyToOne(() => Usuario, { eager: true })
  usuario: Usuario;

  @CreateDateColumn()
  createdAt: Date;
}
