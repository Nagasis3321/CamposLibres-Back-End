import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import type { Request } from 'express';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { JwtAuthGuard } from '../auth/guard/jwt/jwt.guard';
import { User } from '../users/entities/user.entity';

@Controller('campaigns')
@UseGuards(JwtAuthGuard)
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  create(@Body() createCampaignDto: CreateCampaignDto, @Req() req: Request) {
    return this.campaignsService.create(createCampaignDto, req.user as User);
  }

  @Get()
  findAllForUser(@Req() req: Request) {
    return this.campaignsService.findAllForUser((req.user as User).id);
  }

  @Get('by-group/:groupId')
  findAllForGroup(@Param('groupId') groupId: string, @Req() req: Request) {
    return this.campaignsService.findAllForGroup(groupId, (req.user as User).id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.campaignsService.findOne(id, (req.user as User).id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCampaignDto: UpdateCampaignDto, @Req() req: Request) {
    return this.campaignsService.update(id, updateCampaignDto, req.user as User);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.campaignsService.remove(id, req.user as User);
  }
}
