import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Cita } from '../../citas/entities/cita.entity';
import { PaymentMethod } from '../enums/payment-method.enum';
import { PaymentStatus } from '../enums/payment-status.enum';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Cita, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Cita;

  @Column({ name: 'appointment_id', type: 'int', unique: true })
  appointmentId: number;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({
    name: 'token_code',
    type: 'char',
    length: 6,
    unique: true,
    nullable: true,
  })
  tokenCode: string | null;

  @Column({ name: 'token_used', type: 'boolean', default: false })
  tokenUsed: boolean;

  @Column({ name: 'token_expires_at', type: 'timestamp', nullable: true })
  tokenExpiresAt: Date | null;

  // Wompi-specific fields
  @Column({ name: 'wompi_payment_link', type: 'text', nullable: true })
  wompiPaymentLink: string | null;

  @Column({ name: 'wompi_transaction_id', type: 'text', nullable: true })
  wompiTransactionId: string | null;

  @Column({ name: 'wompi_reference', type: 'text', nullable: true })
  wompiReference: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
