import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './entities/group.entity';
import { GroupMember } from './entities/group-member.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private readonly groupMemberRepository: Repository<GroupMember>,
    private readonly usersService: UsersService,
  ) {}

  async create(createGroupDto: CreateGroupDto, owner: User): Promise<Group> {
    const newGroup = this.groupRepository.create({
      ...createGroupDto,
      propietario: owner,
    });

    const savedGroup = await this.groupRepository.save(newGroup);

    const ownerMembership = this.groupMemberRepository.create({
      group: savedGroup,
      user: owner,
      role: 'Propietario',
    });
    await this.groupMemberRepository.save(ownerMembership);

    return this.findOne(savedGroup.id, owner.id);
  }

  async findAllForUser(userId: string): Promise<Group[]> {
    return this.groupRepository
      .createQueryBuilder('group')
      .innerJoin('group.miembros', 'member', 'member.userId = :userId', {
        userId,
      })
      .leftJoinAndSelect('group.propietario', 'propietario')
      .leftJoinAndSelect('group.miembros', 'all_members')
      .leftJoinAndSelect('all_members.user', 'member_user')
      .getMany();
  }

  async findOne(id: string, userId: string): Promise<Group> {
    // Primero verificamos que el usuario tenga acceso al grupo
    const hasAccess = await this.groupRepository
      .createQueryBuilder('group')
      .innerJoin('group.miembros', 'member', 'member.userId = :userId', { userId })
      .where('group.id = :id', { id })
      .getCount();

    if (hasAccess === 0) {
      throw new NotFoundException(
        `Grupo no encontrado o no tienes acceso a él.`,
      );
    }

    // Luego cargamos el grupo completo con TODOS los miembros
    const group = await this.groupRepository
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.propietario', 'propietario')
      .leftJoinAndSelect('group.miembros', 'all_members')
      .leftJoinAndSelect('all_members.user', 'member_user')
      .where('group.id = :id', { id })
      .getOne();

    return group!;
  }

  async update(
    groupId: string,
    updateDto: UpdateGroupDto,
    userId: string,
  ): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['propietario'],
    });

    if (!group) {
      throw new NotFoundException('Grupo no encontrado.');
    }

    if (group.propietario.id !== userId) {
      throw new ForbiddenException('Solo el propietario puede modificar el grupo.');
    }

    Object.assign(group, updateDto);
    return this.groupRepository.save(group);
  }

  async remove(groupId: string, userId: string): Promise<void> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['propietario'],
    });

    if (!group) {
      throw new NotFoundException('Grupo no encontrado.');
    }

    if (group.propietario.id !== userId) {
      throw new ForbiddenException('Solo el propietario puede eliminar el grupo.');
    }

    await this.groupRepository.remove(group);
  }

  async inviteMember(
    groupId: string,
    inviteDto: InviteMemberDto,
    inviter: User,
  ): Promise<GroupMember> {
    await this.checkAdminPermissions(groupId, inviter.id);

    const userToInvite = await this.usersService.findOneByEmail(
      inviteDto.email,
    );
    if (!userToInvite) {
      throw new NotFoundException('Usuario a invitar no encontrado.');
    }

    const existingMembership = await this.groupMemberRepository.findOne({
      where: { groupId, userId: userToInvite.id },
    });
    if (existingMembership) {
      throw new ConflictException('El usuario ya es miembro de este grupo.');
    }

    const newMembership = this.groupMemberRepository.create({
      groupId,
      userId: userToInvite.id,
      role: inviteDto.role,
    });

    return this.groupMemberRepository.save(newMembership);
  }

  async removeMember(
    groupId: string,
    userIdToRemove: string,
    removerId: string,
  ) {
    await this.checkAdminPermissions(groupId, removerId);

    const membershipToRemove = await this.groupMemberRepository.findOne({
      where: { groupId, userId: userIdToRemove },
    });

    if (!membershipToRemove) {
      throw new NotFoundException('La membresía a eliminar no existe.');
    }

    if (membershipToRemove.role === 'Propietario') {
      throw new ForbiddenException('No se puede eliminar al propietario del grupo.');
    }

    await this.groupMemberRepository.remove(membershipToRemove);
    return { message: 'Miembro eliminado correctamente.' };
  }

  private async checkAdminPermissions(groupId: string, userId: string) {
    const membership = await this.groupMemberRepository.findOne({
      where: { groupId, userId },
    });

    if (
      !membership ||
      (membership.role !== 'Propietario' && membership.role !== 'Administrador')
    ) {
      throw new ForbiddenException(
        'No tienes permisos para realizar esta acción.',
      );
    }
  }

  async usersShareGroupWithAdminRole(
    adminUserId: string,
    memberUserId: string,
  ): Promise<boolean> {
    const query = this.groupMemberRepository
      .createQueryBuilder('admin_membership')
      .innerJoin(
        'group_members',
        'member_membership',
        'admin_membership.groupId = member_membership.groupId',
      )
      .where('admin_membership.userId = :adminUserId', { adminUserId })
      .andWhere('member_membership.userId = :memberUserId', { memberUserId })
      .andWhere('admin_membership.role IN (:...roles)', {
        roles: ['Propietario', 'Administrador'],
      });

    const count = await query.getCount();
    return count > 0;
  }
  async updateMemberRole(
    groupId: string,
    userIdToUpdate: string,
    updateDto: UpdateMemberRoleDto,
    updaterId: string,
  ): Promise<GroupMember> {
    await this.checkAdminPermissions(groupId, updaterId);

    const membershipToUpdate = await this.groupMemberRepository.findOne({
      where: { groupId, userId: userIdToUpdate },
    });

    if (!membershipToUpdate) {
      throw new NotFoundException('La membresía a actualizar no existe.');
    }

    if (membershipToUpdate.role === 'Propietario') {
      throw new ForbiddenException('No se puede cambiar el rol del propietario.');
    }

    membershipToUpdate.role = updateDto.role;
    return this.groupMemberRepository.save(membershipToUpdate);
  }
}
