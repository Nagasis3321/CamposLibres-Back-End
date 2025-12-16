// Archivo: src/users/entities/user.entity.ts

import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Group } from '../../groups/entities/group.entity';
import { GroupMember } from '../../groups/entities/group-member.entity';
import { Animal } from '../../animals/entities/animal.entity';
import { Campaign } from 'src/campaigns/entities/campaign.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, select: false })
  password?: string;

  @OneToMany(() => Group, (group) => group.propietario)
  ownedGroups: Group[];

  @OneToMany(() => GroupMember, (member) => member.user)
  groupMembership: GroupMember[];

  @OneToMany(() => Animal, (animal) => animal.dueno)
  animales: Animal[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => Campaign, (campaign) => campaign.propietario)
  campaigns: Campaign[];
}
