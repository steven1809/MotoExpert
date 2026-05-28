import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Vehiculo } from '../../vehiculos/entities/vehiculo.entity';
import { Cita } from '../../citas/entities/cita.entity';
import { WebAuthnCredential } from '../../auth/entities/webauthn-credential.entity';

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

  @Column({ nullable: true })
  banner?: string;

  @Column({ default: 'local' })
  provider: string;

  @Column({ default: 0 })
  points: number;

  @Column({ default: 1 })
  level: number;

  @Column({ default: 'Silver' })
  rank: string;

  @Column('json', { nullable: true, default: [] })
  bonuses: { code: string; discount: number; createdAt: string }[];

  @Column({ type: 'int', default: 0 })
  cancelaciones_sin_aviso: number;

  @Column({ type: 'int', default: 0 })
  numCancelaciones: number;

  @Column({ type: 'timestamp', nullable: true })
  bloqueadoHasta: Date;
  // Campo temporal para guardar el challenge de WebAuthn
  @Column({ nullable: true })
  currentWebAuthnChallenge?: string;

  @OneToMany(() => Vehiculo, (vehiculo) => vehiculo.usuario)
  vehiculos: Vehiculo[];

  @OneToMany(() => Cita, (cita) => cita.usuario)
  citas: Cita[];

  @OneToMany(() => WebAuthnCredential, (cred) => cred.usuario)
  webAuthnCredentials: WebAuthnCredential[];
}
