import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUsersService = {
    create: jest.fn(),
    findOneByEmail: jest.fn(),
    remove: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockUser: User = {
    id: 'user-1',
    nombre: 'Test User',
    email: 'test@example.com',
    password: 'hashedPassword',
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
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const createUserDto: CreateUserDto = {
      nombre: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    it('should register a new user successfully', async () => {
      const expectedUser = {
        id: 'user-1',
        nombre: 'Test User',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.create.mockResolvedValue(expectedUser);

      const result = await service.register(createUserDto);

      expect(usersService.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(expectedUser);
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUsersService.create.mockRejectedValue(
        new ConflictException('El correo electrónico ya está en uso'),
      );

      await expect(service.register(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login successfully with valid credentials', async () => {
      const userWithPassword = {
        ...mockUser,
        password: 'hashedPassword',
      };

      const expectedToken = 'jwt-token';
      const expectedUser = {
        id: 'user-1',
        nombre: 'Test User',
        email: 'test@example.com',
      };

      mockUsersService.findOneByEmail.mockResolvedValue(userWithPassword);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      mockJwtService.sign.mockReturnValue(expectedToken);

      const result = await service.login(loginDto);

      expect(usersService.findOneByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'test@example.com',
      });
      expect(result.accessToken).toBe(expectedToken);
      expect(result.user).not.toHaveProperty('password');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw UnauthorizedException with invalid email', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException with invalid password', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should convert email to lowercase', async () => {
      const loginDtoUpperCase: LoginDto = {
        email: 'TEST@EXAMPLE.COM',
        password: 'password123',
      };

      const userWithPassword = {
        ...mockUser,
        password: 'hashedPassword',
      };

      mockUsersService.findOneByEmail.mockResolvedValue(userWithPassword);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      mockJwtService.sign.mockReturnValue('token');

      await service.login(loginDtoUpperCase);

      expect(usersService.findOneByEmail).toHaveBeenCalledWith('test@example.com');
    });
  });

  describe('demoLogin', () => {
    it('should create demo user if it does not exist', async () => {
      const demoUser = {
        id: 'demo-user-1',
        nombre: 'Usuario Demo',
        email: 'demo@example.com',
        password: 'demoPassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.findOneByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(demoUser);
      mockJwtService.sign.mockReturnValue('demo-token');

      const result = await service.demoLogin();

      expect(usersService.findOneByEmail).toHaveBeenCalledWith('demo@example.com');
      expect(usersService.create).toHaveBeenCalled();
      expect(result.accessToken).toBe('demo-token');
      expect(result.user.email).toBe('demo@example.com');
    });

    it('should login existing demo user', async () => {
      const demoUser = {
        id: 'demo-user-1',
        nombre: 'Usuario Demo',
        email: 'demo@example.com',
        password: 'demoPassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.findOneByEmail.mockResolvedValue(demoUser);
      mockJwtService.sign.mockReturnValue('demo-token');

      const result = await service.demoLogin();

      expect(usersService.findOneByEmail).toHaveBeenCalledWith('demo@example.com');
      expect(usersService.create).not.toHaveBeenCalled();
      expect(result.accessToken).toBe('demo-token');
      expect(result.user.email).toBe('demo@example.com');
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      mockUsersService.remove.mockResolvedValue(undefined);

      await service.deleteUser('user-1');

      expect(usersService.remove).toHaveBeenCalledWith('user-1');
    });
  });
});
