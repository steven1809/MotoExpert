import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('servicios')
export class Servicio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  nombre: string;

  @Column({ nullable: true })
  descripcion: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  precio: number;

  @Column({ nullable: true })
  duracion: number; // en minutos
}
