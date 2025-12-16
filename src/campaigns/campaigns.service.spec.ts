import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { Campaign } from './entities/campaign.entity';
import { Animal } from '../animals/entities/animal.entity';
import { GroupsService } from '../groups/groups.service';
import { User } from '../users/entities/user.entity';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';

describe('CampaignsService', () => {
  let service: CampaignsService;
  let campaignRepository: Repository<Campaign>;
  let animalRepository: Repository<Animal>;
  let groupsService: GroupsService;

  const mockCampaignRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findBy: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockAnimalRepository = {
    findBy: jest.fn(),
  };

  const mockGroupsService = {
    findOne: jest.fn(),
  };

  const mockUser: User = {
    id: 'user-1',
    nombre: 'Test User',
    email: 'test@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
    ownedGroups: [],
    groupMembership: [],
    animales: [],
    campaigns: [],
  };

  const mockAnimal: Animal = {
    id: 'animal-1',
    caravana: 'CAR-001',
    tipoAnimal: 'Vaca',
    pelaje: 'Blanco/a',
    sexo: 'Hembra',
    dueno: mockUser,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignsService,
        {
          provide: getRepositoryToken(Campaign),
          useValue: mockCampaignRepository,
        },
        {
          provide: getRepositoryToken(Animal),
          useValue: mockAnimalRepository,
        },
        {
          provide: GroupsService,
          useValue: mockGroupsService,
        },
      ],
    }).compile();

    service = module.get<CampaignsService>(CampaignsService);
    campaignRepository = module.get<Repository<Campaign>>(
      getRepositoryToken(Campaign),
    );
    animalRepository = module.get<Repository<Animal>>(
      getRepositoryToken(Animal),
    );
    groupsService = module.get<GroupsService>(GroupsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateCampaignDto = {
      nombre: 'Test Campaign',
      fecha: '2024-01-01',
      productosUtilizados: 'Vacuna A',
      observaciones: 'Test observations',
      animalesIds: ['animal-1'],
    };

    it('should create a campaign successfully', async () => {
      const newCampaign = {
        id: 'campaign-1',
        ...createDto,
        animales: [mockAnimal],
        propietario: mockUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAnimalRepository.findBy.mockResolvedValue([mockAnimal]);
      mockCampaignRepository.create.mockReturnValue(newCampaign);
      mockCampaignRepository.save.mockResolvedValue(newCampaign);

      const result = await service.create(createDto, mockUser);

      expect(mockAnimalRepository.findBy).toHaveBeenCalledWith({
        id: In(['animal-1']),
      });
      expect(result).toEqual(newCampaign);
    });

    it('should throw NotFoundException if animal not found', async () => {
      mockAnimalRepository.findBy.mockResolvedValue([]);

      await expect(service.create(createDto, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should create campaign for a group', async () => {
      const createDtoWithGroup: CreateCampaignDto = {
        ...createDto,
        groupId: 'group-1',
      };

      const newCampaign = {
        id: 'campaign-1',
        ...createDtoWithGroup,
        animales: [mockAnimal],
        group: { id: 'group-1' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAnimalRepository.findBy.mockResolvedValue([mockAnimal]);
      mockGroupsService.findOne.mockResolvedValue({ id: 'group-1' });
      mockCampaignRepository.create.mockReturnValue(newCampaign);
      mockCampaignRepository.save.mockResolvedValue(newCampaign);

      const result = await service.create(createDtoWithGroup, mockUser);

      expect(mockGroupsService.findOne).toHaveBeenCalledWith('group-1', 'user-1');
      expect(result.group).toEqual({ id: 'group-1' });
    });
  });

  describe('findOne', () => {
    it('should return a campaign by id', async () => {
      const campaign = {
        id: 'campaign-1',
        nombre: 'Test Campaign',
        fecha: '2024-01-01',
        propietario: mockUser,
        animales: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCampaignRepository.findOne.mockResolvedValue(campaign);

      const result = await service.findOne('campaign-1', 'user-1');

      expect(result).toEqual(campaign);
      expect(mockCampaignRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'campaign-1' },
        relations: ['propietario', 'group', 'group.miembros', 'animales'],
      });
    });

    it('should throw NotFoundException if campaign not found', async () => {
      mockCampaignRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('campaign-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user has no access', async () => {
      const otherUser: User = {
        id: 'user-2',
        nombre: 'Other User',
        email: 'other@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        ownedGroups: [],
        groupMembership: [],
        animales: [],
        campaigns: [],
      };

      const campaign = {
        id: 'campaign-1',
        nombre: 'Test Campaign',
        fecha: '2024-01-01',
        propietario: otherUser,
        group: null,
        animales: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCampaignRepository.findOne.mockResolvedValue(campaign);

      await expect(service.findOne('campaign-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    it('should update a campaign successfully', async () => {
      const existingCampaign = {
        id: 'campaign-1',
        nombre: 'Old Campaign',
        fecha: '2024-01-01',
        propietario: mockUser,
        animales: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateDto: UpdateCampaignDto = {
        nombre: 'Updated Campaign',
      };

      const updatedCampaign = {
        ...existingCampaign,
        nombre: 'Updated Campaign',
      };

      mockCampaignRepository.findOne.mockResolvedValue(existingCampaign);
      mockCampaignRepository.save.mockResolvedValue(updatedCampaign);

      const result = await service.update('campaign-1', updateDto, mockUser);

      expect(result.nombre).toBe('Updated Campaign');
    });

    it('should update animals in campaign', async () => {
      const existingCampaign = {
        id: 'campaign-1',
        nombre: 'Test Campaign',
        fecha: '2024-01-01',
        propietario: mockUser,
        animales: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateDto: UpdateCampaignDto = {
        animalesIds: ['animal-1'],
      };

      mockCampaignRepository.findOne.mockResolvedValue(existingCampaign);
      mockAnimalRepository.findBy.mockResolvedValue([mockAnimal]);
      mockCampaignRepository.save.mockResolvedValue({
        ...existingCampaign,
        animales: [mockAnimal],
      });

      const result = await service.update('campaign-1', updateDto, mockUser);

      expect(result.animales).toHaveLength(1);
      expect(result.animales[0]).toEqual(mockAnimal);
    });
  });

  describe('remove', () => {
    it('should delete a campaign successfully', async () => {
      const campaign = {
        id: 'campaign-1',
        nombre: 'Test Campaign',
        fecha: '2024-01-01',
        propietario: mockUser,
        animales: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCampaignRepository.findOne.mockResolvedValue(campaign);
      mockCampaignRepository.remove.mockResolvedValue(campaign);

      await service.remove('campaign-1', mockUser);

      expect(mockCampaignRepository.remove).toHaveBeenCalledWith(campaign);
    });
  });

  describe('findAllForUser', () => {
    it('should return campaigns for user', async () => {
      const userCampaigns = [
        {
          id: 'campaign-1',
          nombre: 'User Campaign',
          propietario: mockUser,
          animales: [],
        },
      ];

      const groupCampaigns: Campaign[] = [];

      mockCampaignRepository.find.mockResolvedValue(userCampaigns);

      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(groupCampaigns),
      };

      mockCampaignRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.findAllForUser('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].nombre).toBe('User Campaign');
    });
  });
});
