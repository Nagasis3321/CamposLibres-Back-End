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

@Entity({ name: 'births' })
export class Birth {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Animal, { onDelete: 'CASCADE' })
  madre: Animal;

  @ManyToOne(() => Animal, { nullable: true })
  cria?: Animal;

  @Column({ type: 'date' })
  fecha: string;

  @Column({ type: 'enum', enum: ['VIVO', 'MUERTO', 'NATIMUERTO'], default: 'VIVO' })
  estado: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sexoCria?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  peso?: string;

  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  @ManyToOne(() => User)
  usuario: User;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}

