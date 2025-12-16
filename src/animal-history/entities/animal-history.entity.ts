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

export enum HistoryType {
  PARTO = 'PARTO',
  VACUNACION = 'VACUNACION',
  ESTADO = 'ESTADO',
  TRATAMIENTO = 'TRATAMIENTO',
  OBSERVACION = 'OBSERVACION',
  OTRO = 'OTRO',
}

@Entity({ name: 'animal_history' })
export class AnimalHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Animal, { onDelete: 'CASCADE' })
  animal: Animal;

  @Column({ type: 'enum', enum: HistoryType })
  tipo: HistoryType;

  @Column({ type: 'varchar', length: 255 })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column({ type: 'date' })
  fecha: string;

  @ManyToOne(() => User)
  usuario: User;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}

