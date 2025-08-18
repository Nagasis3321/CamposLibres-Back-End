import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Group } from './group.entity';

export type UserRole = 'Propietario' | 'Administrador' | 'Miembro';

@Entity({ name: 'group_members' })
export class GroupMember {
  @PrimaryColumn()
  userId: string;

  @PrimaryColumn()
  groupId: string;

  @ManyToOne(() => User, (user) => user.groupMembership, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Group, (group) => group.miembros, { onDelete: 'CASCADE' })
  group: Group;

  @Column({ type: 'enum', enum: ['Propietario', 'Administrador', 'Miembro'] })
  role: UserRole;
}
