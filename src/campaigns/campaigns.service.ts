import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Campaign } from './entities/campaign.entity';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { User } from '../users/entities/user.entity';
import { GroupsService } from '../groups/groups.service';
import { Animal } from '../animals/entities/animal.entity';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(Animal)
    private readonly animalRepository: Repository<Animal>,
    private readonly groupsService: GroupsService,
  ) {}

  async create(createDto: CreateCampaignDto, user: User): Promise<Campaign> {
    const { groupId, animalesIds, ...campaignData } = createDto;

    const campaign = this.campaignRepository.create(campaignData);
    const animales = await this.animalRepository.findBy({ id: In(animalesIds) });
    if (animales.length !== animalesIds.length) {
      throw new NotFoundException('Uno o más animales no fueron encontrados.');
    }
    campaign.animales = animales;

    if (groupId) {
      await this.groupsService.findOne(groupId, user.id); // Valida que el usuario pertenezca al grupo
      campaign.group = { id: groupId } as any;
    } else {
      campaign.propietario = user;
    }

    return this.campaignRepository.save(campaign);
  }

  async findAllForUser(userId: string): Promise<Campaign[]> {
    const userCampaigns = await this.campaignRepository.find({
      where: { propietario: { id: userId } },
      relations: ['animales', 'animales.dueno', 'propietario'],
    });

    const groupCampaigns = await this.campaignRepository
      .createQueryBuilder('campaign')
      .innerJoin('campaign.group', 'group')
      .innerJoin('group.miembros', 'member', 'member.userId = :userId', { userId })
      .leftJoinAndSelect('campaign.animales', 'animales')
      .leftJoinAndSelect('animales.dueno', 'dueno')
      .leftJoinAndSelect('campaign.group', 'groupDetails')
      .getMany();

    return [...userCampaigns, ...groupCampaigns];
  }

  async findAllForGroup(groupId: string, userId: string): Promise<Campaign[]> {
    await this.groupsService.findOne(groupId, userId); // Validar pertenencia
    return this.campaignRepository.find({
        where: { group: { id: groupId } },
        relations: ['animales', 'animales.dueno', 'group']
    });
  }

  async findOne(id: string, userId: string): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({
      where: { id },
      relations: ['propietario', 'group', 'group.miembros', 'animales', 'animales.dueno'],
    });
    if (!campaign) throw new NotFoundException('Campaña no encontrada.');

    const isOwner = campaign.propietario?.id === userId;
    const isMember = campaign.group?.miembros.some(m => m.userId === userId);

    if (!isOwner && !isMember) {
      throw new ForbiddenException('No tienes acceso a esta campaña.');
    }
    return campaign;
  }
  
  async update(id: string, updateDto: UpdateCampaignDto, user: User): Promise<Campaign> {
    const campaign = await this.findOne(id, user.id);
    
    if (updateDto.animalesIds) {
      const animales = await this.animalRepository.findBy({ id: In(updateDto.animalesIds) });
      if (animales.length !== updateDto.animalesIds.length) {
        throw new NotFoundException('Uno o más animales no fueron encontrados.');
      }
      campaign.animales = animales;
    }

    const { animalesIds, ...campaignData } = updateDto;
    Object.assign(campaign, campaignData);
    return this.campaignRepository.save(campaign);
  }

  async remove(id: string, user: User): Promise<void> {
    const campaign = await this.findOne(id, user.id);
    await this.campaignRepository.remove(campaign);
  }
}
