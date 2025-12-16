import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      nombre: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    it('should create a new user successfully', async () => {
      const hashedPassword = 'hashedPassword123';
      const savedUser = {
        id: '1',
        nombre: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);
      mockRepository.create.mockReturnValue(savedUser);
      mockRepository.save.mockResolvedValue(savedUser);

      const result = await service.create(createUserDto);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockRepository.create).toHaveBeenCalledWith({
        nombre: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
      });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.password).toBeUndefined();
      expect(result.email).toBe('test@example.com');
    });

    it('should throw ConflictException if email already exists', async () => {
      const existingUser = { id: '1', email: 'test@example.com' };
      mockRepository.findOne.mockResolvedValue(existingUser);

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should convert email to lowercase', async () => {
      const createDtoWithUpperCase: CreateUserDto = {
        ...createUserDto,
        email: 'TEST@EXAMPLE.COM',
      };
      const hashedPassword = 'hashedPassword123';
      const savedUser = {
        id: '1',
        nombre: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);
      mockRepository.create.mockReturnValue(savedUser);
      mockRepository.save.mockResolvedValue(savedUser);

      await service.create(createDtoWithUpperCase);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const users = [
        {
          id: '1',
          nombre: 'User 1',
          email: 'user1@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          nombre: 'User 2',
          email: 'user2@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRepository.findAndCount.mockResolvedValue([users, 2]);

      const result = await service.findAll(1, 10);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        take: 10,
        skip: 0,
        order: { createdAt: 'DESC' },
        select: ['id', 'nombre', 'email', 'createdAt', 'updatedAt'],
      });
    });
  });

  describe('searchByEmail', () => {
    it('should search users by email pattern', async () => {
      const users = [
        {
          id: '1',
          nombre: 'Test User',
          email: 'test@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRepository.find.mockResolvedValue(users);

      const result = await service.searchByEmail('test');

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('test@example.com');
      expect(mockRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOneById', () => {
    it('should return a user by id', async () => {
      const user = {
        id: '1',
        nombre: 'Test User',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(user);

      const result = await service.findOneById('1');

      expect(result).toEqual(user);
      expect(result.password).toBeUndefined();
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        select: ['id', 'nombre', 'email', 'createdAt', 'updatedAt'],
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOneById('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateUserDto = {
      nombre: 'Updated Name',
    };

    it('should update user successfully', async () => {
      const existingUser = {
        id: '1',
        nombre: 'Old Name',
        email: 'test@example.com',
        password: 'oldHash',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const updatedUser = {
        ...existingUser,
        nombre: 'Updated Name',
      };

      mockRepository.findOne
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(null);
      mockRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update('1', updateDto);

      expect(result.nombre).toBe('Updated Name');
      expect(result.password).toBeUndefined();
    });

    it('should hash password if provided', async () => {
      const updateDtoWithPassword: UpdateUserDto = {
        password: 'newPassword123',
      };
      const existingUser = {
        id: '1',
        nombre: 'Test User',
        email: 'test@example.com',
        password: 'oldHash',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const hashedPassword = 'newHashedPassword';

      mockRepository.findOne.mockResolvedValue(existingUser);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);
      mockRepository.save.mockResolvedValue({
        ...existingUser,
        password: hashedPassword,
      });

      await service.update('1', updateDtoWithPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123', 10);
    });

    it('should throw ConflictException if email already in use', async () => {
      const updateDto: UpdateUserDto = {
        email: 'existing@example.com',
      };
      const existingUser = {
        id: '1',
        nombre: 'Test User',
        email: 'test@example.com',
      };
      const otherUser = {
        id: '2',
        nombre: 'Other User',
        email: 'existing@example.com',
      };

      mockRepository.findOne
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(otherUser);

      await expect(service.update('1', updateDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update('1', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete user successfully', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove('1');

      expect(mockRepository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove('1')).rejects.toThrow(NotFoundException);
    });
  });
});

