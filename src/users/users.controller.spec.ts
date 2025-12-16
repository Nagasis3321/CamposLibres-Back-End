import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOneById: jest.fn(),
    searchByEmail: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateUserDto = {
      nombre: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    it('should create a new user', async () => {
      const expectedResult = {
        id: '1',
        nombre: 'Test User',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const expectedResult = {
        data: [
          {
            id: '1',
            nombre: 'User 1',
            email: 'user1@example.com',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockUsersService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll('1', '10');

      expect(service.findAll).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual(expectedResult);
    });

    it('should use default pagination values', async () => {
      const expectedResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      };

      mockUsersService.findAll.mockResolvedValue(expectedResult);

      await controller.findAll(undefined, undefined);

      expect(service.findAll).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('searchByEmail', () => {
    it('should search users by email', async () => {
      const expectedResult = [
        {
          id: '1',
          nombre: 'Test User',
          email: 'test@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockUsersService.searchByEmail.mockResolvedValue(expectedResult);

      const result = await controller.searchByEmail('test');

      expect(service.searchByEmail).toHaveBeenCalledWith('test');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const expectedResult = {
        id: '1',
        nombre: 'Test User',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.findOneById.mockResolvedValue(expectedResult);

      const result = await controller.findOne('1');

      expect(service.findOneById).toHaveBeenCalledWith('1');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    const updateDto: UpdateUserDto = {
      nombre: 'Updated Name',
    };

    it('should update a user', async () => {
      const expectedResult = {
        id: '1',
        nombre: 'Updated Name',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.update.mockResolvedValue(expectedResult);

      const result = await controller.update('1', updateDto);

      expect(service.update).toHaveBeenCalledWith('1', updateDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      mockUsersService.remove.mockResolvedValue(undefined);

      await controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith('1');
    });
  });
});
