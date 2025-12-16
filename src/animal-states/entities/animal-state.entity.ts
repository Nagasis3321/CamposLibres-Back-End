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

export enum StateType {
  SALUDABLE = 'SALUDABLE',
  ENFERMO = 'ENFERMO',
  EN_TRATAMIENTO = 'EN_TRATAMIENTO',
  GESTANTE = 'GESTANTE',
  LACTANDO = 'LACTANDO',
  SECA = 'SECA',
  VENDIDO = 'VENDIDO',
  MUERTO = 'MUERTO',
  OTRO = 'OTRO',
}

@Entity({ name: 'animal_states' })
export class AnimalState {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Animal, { onDelete: 'CASCADE' })
  animal: Animal;

  @Column({ type: 'enum', enum: StateType })
  tipo: StateType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nombre?: string;

  @Column({ type: 'date' })
  fechaInicio: string;

  @Column({ type: 'date', nullable: true })
  fechaFin?: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @ManyToOne(() => User)
  usuario: User;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}

