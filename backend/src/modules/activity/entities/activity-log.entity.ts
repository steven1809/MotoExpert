import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  action: string;

  @Column('text')
  description: string;

  @Column()
  entityType: string;

  @Column({ nullable: true })
  entityId: string;

  @Column()
  performedBy: string;

  @Column({ default: 'sistema' })
  performedByRole: string;

  @CreateDateColumn()
  createdAt: Date;
}
