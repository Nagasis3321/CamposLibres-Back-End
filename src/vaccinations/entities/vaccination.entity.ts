import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Animal } from '../../animals/entities/animal.entity';

@Entity({ name: 'vaccinations' })
export class Vaccination {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Animal, { onDelete: 'CASCADE' })
  animal: Animal;

  @Column({ type: 'varchar', length: 255 })
  nombreVacuna: string;

  @Column({ type: 'date' })
  fecha: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lote?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  veterinario?: string;

  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  @ManyToOne(() => User)
  usuario: User;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}

