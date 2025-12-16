import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { GroupMember } from './group-member.entity';
import { Campaign } from 'src/campaigns/entities/campaign.entity';

@Entity({ name: 'groups' })
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @ManyToOne(() => User, (user) => user.ownedGroups, { onDelete: 'CASCADE' })
  propietario: User;

  @OneToMany(() => GroupMember, (member) => member.group, { cascade: true })
  miembros: GroupMember[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => Campaign, (campaign) => campaign.group)
  campaigns: Campaign[];
}
