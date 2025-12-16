import { IsIn, IsNotEmpty } from 'class-validator';
import type { UserRole } from '../entities/group-member.entity';

export class UpdateMemberRoleDto {
  @IsIn(['Administrador', 'Miembro'])
  @IsNotEmpty()
  role: UserRole;
}
