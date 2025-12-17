import {
    Column,
    CreateDateColumn,
    Entity,
    JoinTable,
    ManyToMany,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
  } from 'typeorm';
  import { User } from '../../users/entities/user.entity';
  import { Group } from '../../groups/entities/group.entity';
  import { Animal } from '../../animals/entities/animal.entity';
  
  @Entity({ name: 'campaigns' })
  export class Campaign {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ type: 'varchar', length: 255 })
    nombre: string;
  
    @Column({ type: 'date' })
    fecha: string;
  
    @Column({ type: 'varchar', nullable: true })
    productosUtilizados?: string;
  
  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  @Column({ type: 'varchar', length: 50, default: 'Pendiente' })
  estado: string;

  @ManyToOne(() => User, (user) => user.campaigns, { nullable: true, onDelete: 'CASCADE' })
  propietario?: User;
  
    @ManyToOne(() => Group, (group) => group.campaigns, { nullable: true, onDelete: 'CASCADE' })
    group?: Group;
  
    @ManyToMany(() => Animal, { cascade: true })
    @JoinTable({
      name: 'campaign_animals',
      joinColumn: { name: 'campaignId', referencedColumnName: 'id' },
      inverseJoinColumn: { name: 'animalId', referencedColumnName: 'id' },
    })
    animales: Animal[];
  
    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;
  
    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;
  }