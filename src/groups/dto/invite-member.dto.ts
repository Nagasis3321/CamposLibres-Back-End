import { IsEmail, IsIn, IsNotEmpty } from 'class-validator';
import type { UserRole } from '../entities/group-member.entity';

export class InviteMemberDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsIn(['Administrador', 'Miembro'])
  @IsNotEmpty()
  role: UserRole;
}
