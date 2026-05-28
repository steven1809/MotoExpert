import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity('webauthn_credentials')
export class WebAuthnCredential {
  @PrimaryGeneratedColumn()
  id: number;

  // El ID de la credencial (formato base64url o string único)
  @Column({ unique: true })
  credentialID: string;

  // La llave pública de la credencial
  @Column({ type: 'bytea' })
  credentialPublicKey: Buffer;

  // Contador para prevenir ataques de replay
  @Column({ type: 'bigint', default: 0 })
  counter: number;

  // Formato de transporte (usb, nfc, ble, internal, hybrid)
  @Column({ type: 'json', nullable: true })
  transports: string[];

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  usuario: Usuario;

  @Column()
  usuarioId: number;
}
