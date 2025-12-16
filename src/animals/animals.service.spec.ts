import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { AnimalsService } from './animals.service';
import { Animal } from './entities/animal.entity';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';
import { User } from '../users/entities/user.entity';
import { GroupsService } from '../groups/groups.service';

describe('AnimalsService', () => {
  let service: AnimalsService;
  let animalRepository: Repository<Animal>;
  let groupsService: GroupsService;

  const mockAnimalRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findOneBy: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockGroupsService = {
    usersShareGroupWithAdminRole: jest.fn(),
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnimalsService,
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

    service = module.get<AnimalsService>(AnimalsService);
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
    const createDto: CreateAnimalDto = {
      caravana: 'CAR-001',
      tipoAnimal: 'Vaca',
      pelaje: 'Blanco/a',
      sexo: 'Hembra',
      raza: 'Holando',
      fechaNacimiento: '2020-01-01',
      descripcion: 'Test animal',
    };

    it('should create an animal successfully', async () => {
      const newAnimal = {
        id: 'animal-1',
        ...createDto,
        dueno: mockUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAnimalRepository.create.mockReturnValue(newAnimal);
      mockAnimalRepository.save.mockResolvedValue(newAnimal);

      const result = await service.create(createDto, mockUser);

      expect(mockAnimalRepository.create).toHaveBeenCalledWith({
        ...createDto,
        dueno: mockUser,
      });
      expect(mockAnimalRepository.save).toHaveBeenCalled();
      expect(result).toEqual(newAnimal);
    });

    it('should create animal with group owner when duenoId provided', async () => {
      const groupOwner: User = {
        id: 'user-2',
        nombre: 'Group Owner',
        email: 'owner@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        ownedGroups: [],
        groupMembership: [],
        animales: [],
        campaigns: [],
      };

      const createDtoWithOwner: CreateAnimalDto = {
        ...createDto,
        duenoId: 'user-2',
      };

      mockGroupsService.usersShareGroupWithAdminRole.mockResolvedValue(true);
      mockAnimalRepository.create.mockReturnValue({
        ...createDtoWithOwner,
        dueno: groupOwner,
      });
      mockAnimalRepository.save.mockResolvedValue({
        id: 'animal-1',
        ...createDtoWithOwner,
        dueno: groupOwner,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create(createDtoWithOwner, mockUser);

      expect(result.dueno.id).toBe('user-2');
    });
  });

  describe('findOne', () => {
    it('should return an animal by id', async () => {
      const animal: Animal = {
        id: 'animal-1',
        caravana: 'CAR-001',
        tipoAnimal: 'Vaca',
        pelaje: 'Blanco/a',
        sexo: 'Hembra',
        dueno: mockUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAnimalRepository.findOne.mockResolvedValue(animal);

      const result = await service.findOne('animal-1', 'user-1');

      expect(result).toEqual(animal);
      expect(mockAnimalRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'animal-1' },
        relations: ['dueno'],
      });
    });

    it('should throw NotFoundException if animal not found', async () => {
      mockAnimalRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('animal-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not owner', async () => {
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

      const animal: Animal = {
        id: 'animal-1',
        caravana: 'CAR-001',
        tipoAnimal: 'Vaca',
        pelaje: 'Blanco/a',
        sexo: 'Hembra',
        dueno: otherUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAnimalRepository.findOne.mockResolvedValue(animal);

      await expect(
        service.findOne('animal-1', 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateAnimalDto = {
      caravana: 'CAR-002',
    };

    it('should update an animal successfully', async () => {
      const existingAnimal: Animal = {
        id: 'animal-1',
        caravana: 'CAR-001',
        tipoAnimal: 'Vaca',
        pelaje: 'Blanco/a',
        sexo: 'Hembra',
        dueno: mockUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedAnimal = {
        ...existingAnimal,
        caravana: 'CAR-002',
      };

      mockAnimalRepository.findOne.mockResolvedValue(existingAnimal);
      mockAnimalRepository.save.mockResolvedValue(updatedAnimal);

      const result = await service.update('animal-1', updateDto, 'user-1');

      expect(result.caravana).toBe('CAR-002');
    });

    it('should throw NotFoundException if animal not found', async () => {
      mockAnimalRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('animal-1', updateDto, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete an animal successfully', async () => {
      const animal: Animal = {
        id: 'animal-1',
        caravana: 'CAR-001',
        tipoAnimal: 'Vaca',
        pelaje: 'Blanco/a',
        sexo: 'Hembra',
        dueno: mockUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAnimalRepository.findOne.mockResolvedValue(animal);
      mockAnimalRepository.remove.mockResolvedValue(animal);

      await service.remove('animal-1', 'user-1');

      expect(mockAnimalRepository.remove).toHaveBeenCalledWith(animal);
    });
  });

  describe('updateRelations', () => {
    it('should update mother relation successfully', async () => {
      const child: Animal = {
        id: 'animal-1',
        tipoAnimal: 'Ternero',
        pelaje: 'Blanco/a',
        sexo: 'Macho',
        dueno: mockUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mother: Animal = {
        id: 'animal-2',
        tipoAnimal: 'Vaca',
        pelaje: 'Blanco/a',
        sexo: 'Hembra',
        dueno: mockUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAnimalRepository.findOne
        .mockResolvedValueOnce(child)
        .mockResolvedValueOnce(mother);
      mockAnimalRepository.save.mockResolvedValue({
        ...child,
        idMadre: 'animal-2',
      });

      const result = await service.updateRelations(
        'animal-1',
        { idMadre: 'animal-2' },
        'user-1',
      );

      expect(result.idMadre).toBe('animal-2');
    });

    it('should throw error if mother is not a female', async () => {
      const child: Animal = {
        id: 'animal-1',
        tipoAnimal: 'Ternero',
        pelaje: 'Blanco/a',
        sexo: 'Macho',
        dueno: mockUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const notMother: Animal = {
        id: 'animal-2',
        tipoAnimal: 'Toro',
        pelaje: 'Negro',
        sexo: 'Macho',
        dueno: mockUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAnimalRepository.findOne
        .mockResolvedValueOnce(child)
        .mockResolvedValueOnce(notMother);

      await expect(
        service.updateRelations('animal-1', { idMadre: 'animal-2' }, 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getFamilyRelations', () => {
    it('should return family relations', async () => {
      const animal: Animal = {
        id: 'animal-1',
        idMadre: 'animal-2',
        idPadre: 'animal-3',
        tipoAnimal: 'Ternero',
        pelaje: 'Blanco/a',
        sexo: 'Macho',
        dueno: mockUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mother: Animal = {
        id: 'animal-2',
        tipoAnimal: 'Vaca',
        pelaje: 'Blanco/a',
        sexo: 'Hembra',
        dueno: mockUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const father: Animal = {
        id: 'animal-3',
        tipoAnimal: 'Toro',
        pelaje: 'Negro',
        sexo: 'Macho',
        dueno: mockUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const children: Animal[] = [];

      mockAnimalRepository.findOne
        .mockResolvedValueOnce(animal)
        .mockResolvedValueOnce(mother)
        .mockResolvedValueOnce(father);
      mockAnimalRepository.find.mockResolvedValue(children);

      const result = await service.getFamilyRelations('animal-1', 'user-1');

      expect(result.animal).toEqual(animal);
      expect(result.madre).toEqual(mother);
      expect(result.padre).toEqual(father);
      expect(result.crias).toEqual(children);
    });
  });

  describe('findAllForUser', () => {
    it('should return paginated animals for user', async () => {
      const animals: Animal[] = [
        {
          id: 'animal-1',
          caravana: 'CAR-001',
          tipoAnimal: 'Vaca',
          pelaje: 'Blanco/a',
          sexo: 'Hembra',
          dueno: mockUser,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([animals, 1]),
      };

      mockAnimalRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.findAllForUser(mockUser, { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
});

