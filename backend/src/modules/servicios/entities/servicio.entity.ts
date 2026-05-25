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
  duracion: number;

  @Column({ type: 'int', nullable: true })
  duration_minutes: number;

  @Column({ type: 'text', nullable: true })
  incluye: string;

  @Column({ type: 'text', nullable: true })
  beneficios: string;

  @Column({ type: 'text', nullable: true, default: 'Moto' })
  tipoVehiculo: string;
}
