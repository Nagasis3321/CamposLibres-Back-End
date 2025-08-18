import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'animals' })
export class Animal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  caravana?: string;

  @Column({
    type: 'enum',
    enum: ['Vaca', 'Vaquilla', 'Ternero','Ternera', 'Novillo', 'Toro'],
  })
  tipoAnimal: string;

  @Column({ type: 'varchar' })
  pelaje: string;

  @Column({ type: 'enum', enum: ['Hembra', 'Macho'] })
  sexo: string;

  @Column({ type: 'varchar', nullable: true })
  raza?: string;

  @Column({ type: 'date', nullable: true })
  fechaNacimiento?: string;

  @Column({ type: 'uuid', nullable: true })
  idMadre?: string;

  @Column({ type: 'uuid', nullable: true })
  idPadre?: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @ManyToOne(() => User, (user) => user.animales)
  dueno: User;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
