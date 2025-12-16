import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    demoLogin: jest.fn(),
    deleteUser: jest.fn(),
  };

  const mockRequest = {
    user: {
      sub: 'user-1',
      email: 'test@example.com',
    },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    const createUserDto: CreateUserDto = {
      nombre: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    it('should register a new user', async () => {
      const expectedResult = {
        id: 'user-1',
        nombre: 'Test User',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(createUserDto);

      expect(service.register).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login successfully', async () => {
      const expectedResult = {
        accessToken: 'jwt-token',
        user: {
          id: 'user-1',
          nombre: 'Test User',
          email: 'test@example.com',
        },
      };

      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto);

      expect(service.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('demoLogin', () => {
    it('should create and login demo user', async () => {
      const expectedResult = {
        accessToken: 'demo-token',
        user: {
          id: 'demo-user-1',
          nombre: 'Usuario Demo',
          email: 'demo@example.com',
        },
      };

      mockAuthService.demoLogin.mockResolvedValue(expectedResult);

      const result = await controller.demoLogin();

      expect(service.demoLogin).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getProfile', () => {
    it('should return user profile from request', () => {
      const result = controller.getProfile(mockRequest);

      expect(result).toEqual({
        sub: 'user-1',
        email: 'test@example.com',
      });
    });
  });

  describe('deleteUser', () => {
    it('should delete user profile', async () => {
      mockAuthService.deleteUser.mockResolvedValue(undefined);

      await controller.deleteUser(mockRequest);

      expect(service.deleteUser).toHaveBeenCalledWith('user-1');
    });
  });
});
