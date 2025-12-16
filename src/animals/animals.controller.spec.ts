import { Test, TestingModule } from '@nestjs/testing';
import { AnimalsController } from './animals.controller';
import { AnimalsService } from './animals.service';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';
import { User } from '../users/entities/user.entity';

describe('AnimalsController', () => {
  let controller: AnimalsController;
  let service: AnimalsService;

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

  const mockAnimalsService = {
    create: jest.fn(),
    findAllForUser: jest.fn(),
    findAllForGroup: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    updateRelations: jest.fn(),
    getFamilyRelations: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnimalsController],
      providers: [
        {
          provide: AnimalsService,
          useValue: mockAnimalsService,
        },
      ],
    }).compile();

    controller = module.get<AnimalsController>(AnimalsController);
    service = module.get<AnimalsService>(AnimalsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateAnimalDto = {
      caravana: 'CAR-001',
      tipoAnimal: 'Vaca',
      pelaje: 'Blanco/a',
      sexo: 'Hembra',
    };

    it('should create an animal', async () => {
      const expectedResult = {
        id: 'animal-1',
        ...createDto,
        dueno: mockUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAnimalsService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto, mockRequest);

      expect(service.create).toHaveBeenCalledWith(createDto, mockUser);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAllForUser', () => {
    it('should return paginated animals', async () => {
      const paginationDto = { page: 1, limit: 10 };
      const expectedResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      };

      mockAnimalsService.findAllForUser.mockResolvedValue(expectedResult);

      const result = await controller.findAllForUser(mockRequest, paginationDto);

      expect(service.findAllForUser).toHaveBeenCalledWith(mockUser, paginationDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a single animal', async () => {
      const expectedResult = {
        id: 'animal-1',
        caravana: 'CAR-001',
        tipoAnimal: 'Vaca',
        pelaje: 'Blanco/a',
        sexo: 'Hembra',
        dueno: mockUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAnimalsService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne('animal-1', mockRequest);

      expect(service.findOne).toHaveBeenCalledWith('animal-1', 'user-1');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    const updateDto: UpdateAnimalDto = {
      caravana: 'CAR-002',
    };

    it('should update an animal', async () => {
      const expectedResult = {
        id: 'animal-1',
        caravana: 'CAR-002',
        tipoAnimal: 'Vaca',
        pelaje: 'Blanco/a',
        sexo: 'Hembra',
        dueno: mockUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAnimalsService.update.mockResolvedValue(expectedResult);

      const result = await controller.update('animal-1', updateDto, mockRequest);

      expect(service.update).toHaveBeenCalledWith('animal-1', updateDto, 'user-1');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should delete an animal', async () => {
      mockAnimalsService.remove.mockResolvedValue(undefined);

      await controller.remove('animal-1', mockRequest);

      expect(service.remove).toHaveBeenCalledWith('animal-1', 'user-1');
    });
  });

  describe('updateRelations', () => {
    it('should update animal relations', async () => {
      const relationsDto = { idMadre: 'animal-2' };
      const expectedResult = {
        id: 'animal-1',
        idMadre: 'animal-2',
        tipoAnimal: 'Ternero',
        pelaje: 'Blanco/a',
        sexo: 'Macho',
        dueno: mockUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAnimalsService.updateRelations.mockResolvedValue(expectedResult);

      const result = await controller.updateRelations('animal-1', relationsDto, mockRequest);

      expect(service.updateRelations).toHaveBeenCalledWith('animal-1', relationsDto, 'user-1');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getFamilyRelations', () => {
    it('should return family relations', async () => {
      const expectedResult = {
        animal: {
          id: 'animal-1',
          tipoAnimal: 'Ternero',
          pelaje: 'Blanco/a',
          sexo: 'Macho',
          dueno: mockUser,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        madre: null,
        padre: null,
        crias: [],
      };

      mockAnimalsService.getFamilyRelations.mockResolvedValue(expectedResult);

      const result = await controller.getFamilyRelations('animal-1', mockRequest);

      expect(service.getFamilyRelations).toHaveBeenCalledWith('animal-1', 'user-1');
      expect(result).toEqual(expectedResult);
    });
  });
});

