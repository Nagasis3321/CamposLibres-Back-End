import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
  Delete,
  Patch,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { JwtAuthGuard } from '../auth/guard/jwt/jwt.guard';
import { User } from '../users/entities/user.entity';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  create(@Body() createGroupDto: CreateGroupDto, @Req() req: Request) {
    return this.groupsService.create(createGroupDto, req.user as User);
  }

  @Get()
  findAllForUser(@Req() req: Request) {
    return this.groupsService.findAllForUser((req.user as User).id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.groupsService.findOne(id, (req.user as User).id);
  }

  @Patch(':id')
  update(
    @Param('id') groupId: string,
    @Body() updateGroupDto: UpdateGroupDto,
    @Req() req: Request,
  ) {
    return this.groupsService.update(
      groupId,
      updateGroupDto,
      (req.user as User).id,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') groupId: string, @Req() req: Request) {
    return this.groupsService.remove(groupId, (req.user as User).id);
  }

  @Post(':id/members')
  inviteMember(
    @Param('id') groupId: string,
    @Body() inviteDto: InviteMemberDto,
    @Req() req: Request,
  ) {
    return this.groupsService.inviteMember(
      groupId,
      inviteDto,
      req.user as User,
    );
  }

  @Patch(':id/members/:userId') 
  updateMemberRole(
    @Param('id') groupId: string,
    @Param('userId') userIdToUpdate: string,
    @Body() updateDto: UpdateMemberRoleDto,
    @Req() req: Request,
  ) {
    return this.groupsService.updateMemberRole(
      groupId,
      userIdToUpdate,
      updateDto,
      (req.user as User).id,
    );
  }


  @Delete(':id/members/:userId')
  removeMember(
    @Param('id') groupId: string,
    @Param('userId') userIdToRemove: string,
    @Req() req: Request,
  ) {
    return this.groupsService.removeMember(
      groupId,
      userIdToRemove,
      (req.user as User).id,
    );
  }
}
