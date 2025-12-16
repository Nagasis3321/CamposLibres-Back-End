import { Test, TestingModule } from '@nestjs/testing';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { User } from '../users/entities/user.entity';

describe('CampaignsController', () => {
  let controller: CampaignsController;
  let service: CampaignsService;

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

  const mockRequest = {
    user: mockUser,
  } as any;

  const mockCampaignsService = {
    create: jest.fn(),
    findAllForUser: jest.fn(),
    findAllForGroup: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CampaignsController],
      providers: [
        {
          provide: CampaignsService,
          useValue: mockCampaignsService,
        },
      ],
    }).compile();

    controller = module.get<CampaignsController>(CampaignsController);
    service = module.get<CampaignsService>(CampaignsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateCampaignDto = {
      nombre: 'Test Campaign',
      fecha: '2024-01-01',
      animalesIds: ['animal-1'],
    };

    it('should create a campaign', async () => {
      const expectedResult = {
        id: 'campaign-1',
        nombre: 'Test Campaign',
        fecha: '2024-01-01',
        animales: [],
        propietario: mockUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCampaignsService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto, mockRequest);

      expect(service.create).toHaveBeenCalledWith(createDto, mockUser);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAllForUser', () => {
    it('should return all campaigns for user', async () => {
      const expectedResult = [
        {
          id: 'campaign-1',
          nombre: 'Test Campaign',
          fecha: '2024-01-01',
          animales: [],
          propietario: mockUser,
        },
      ];

      mockCampaignsService.findAllForUser.mockResolvedValue(expectedResult);

      const result = await controller.findAllForUser(mockRequest);

      expect(service.findAllForUser).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAllForGroup', () => {
    it('should return campaigns for a group', async () => {
      const expectedResult = [
        {
          id: 'campaign-1',
          nombre: 'Test Campaign',
          fecha: '2024-01-01',
          animales: [],
          group: { id: 'group-1' },
        },
      ];

      mockCampaignsService.findAllForGroup.mockResolvedValue(expectedResult);

      const result = await controller.findAllForGroup('group-1', mockRequest);

      expect(service.findAllForGroup).toHaveBeenCalledWith('group-1', 'user-1');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a single campaign', async () => {
      const expectedResult = {
        id: 'campaign-1',
        nombre: 'Test Campaign',
        fecha: '2024-01-01',
        animales: [],
        propietario: mockUser,
      };

      mockCampaignsService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne('campaign-1', mockRequest);

      expect(service.findOne).toHaveBeenCalledWith('campaign-1', 'user-1');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    const updateDto: UpdateCampaignDto = {
      nombre: 'Updated Campaign',
    };

    it('should update a campaign', async () => {
      const expectedResult = {
        id: 'campaign-1',
        nombre: 'Updated Campaign',
        fecha: '2024-01-01',
        animales: [],
        propietario: mockUser,
      };

      mockCampaignsService.update.mockResolvedValue(expectedResult);

      const result = await controller.update('campaign-1', updateDto, mockRequest);

      expect(service.update).toHaveBeenCalledWith('campaign-1', updateDto, mockUser);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should delete a campaign', async () => {
      mockCampaignsService.remove.mockResolvedValue(undefined);

      await controller.remove('campaign-1', mockRequest);

      expect(service.remove).toHaveBeenCalledWith('campaign-1', mockUser);
    });
  });
});
