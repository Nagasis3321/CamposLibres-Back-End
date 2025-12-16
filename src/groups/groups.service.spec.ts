import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { Group } from './entities/group.entity';
import { GroupMember } from './entities/group-member.entity';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { InviteMemberDto } from './dto/invite-member.dto';

describe('GroupsService', () => {
  let service: GroupsService;
  let groupRepository: Repository<Group>;
  let groupMemberRepository: Repository<GroupMember>;
  let usersService: UsersService;

  const mockGroupRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockGroupMemberRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockUsersService = {
    findOneByEmail: jest.fn(),
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
        GroupsService,
        {
          provide: getRepositoryToken(Group),
          useValue: mockGroupRepository,
        },
        {
          provide: getRepositoryToken(GroupMember),
          useValue: mockGroupMemberRepository,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<GroupsService>(GroupsService);
    groupRepository = module.get<Repository<Group>>(getRepositoryToken(Group));
    groupMemberRepository = module.get<Repository<GroupMember>>(
      getRepositoryToken(GroupMember),
    );
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateGroupDto = {
      nombre: 'Test Group',
    };

    it('should create a group successfully', async () => {
      const newGroup = {
        id: 'group-1',
        nombre: 'Test Group',
        propietario: mockUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const savedGroup = { ...newGroup };
      const ownerMembership = {
        groupId: 'group-1',
        userId: 'user-1',
        role: 'Propietario' as const,
      };

      mockGroupRepository.create.mockReturnValue(newGroup);
      mockGroupRepository.save.mockResolvedValue(savedGroup);
      mockGroupMemberRepository.create.mockReturnValue(ownerMembership);
      mockGroupMemberRepository.save.mockResolvedValue(ownerMembership);

      // Mock findOne for the return statement
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(savedGroup),
      };
      mockGroupRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.create(createDto, mockUser);

      expect(mockGroupRepository.create).toHaveBeenCalledWith({
        ...createDto,
        propietario: mockUser,
      });
      expect(mockGroupRepository.save).toHaveBeenCalled();
      expect(result).toEqual(savedGroup);
    });
  });

  describe('findOne', () => {
    it('should return a group by id', async () => {
      const group = {
        id: 'group-1',
        nombre: 'Test Group',
        propietario: mockUser,
        miembros: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(group),
      };
      mockGroupRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.findOne('group-1', 'user-1');

      expect(result).toEqual(group);
    });

    it('should throw NotFoundException if group not found', async () => {
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockGroupRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await expect(service.findOne('group-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('inviteMember', () => {
    const inviteDto: InviteMemberDto = {
      email: 'newuser@example.com',
      role: 'Miembro' as const,
    };

    it('should invite a member successfully', async () => {
      const group = {
        id: 'group-1',
        nombre: 'Test Group',
        propietario: mockUser,
      };

      const invitedUser: User = {
        id: 'user-2',
        nombre: 'New User',
        email: 'newuser@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        ownedGroups: [],
        groupMembership: [],
        animales: [],
        campaigns: [],
      };

      const membership = {
        groupId: 'group-1',
        userId: 'user-2',
        role: 'Miembro' as const,
      };

      // Mock checkAdminPermissions (internal method)
      mockGroupMemberRepository.findOne.mockResolvedValue({
        groupId: 'group-1',
        userId: 'user-1',
        role: 'Propietario',
      });

      mockUsersService.findOneByEmail.mockResolvedValue(invitedUser);
      mockGroupMemberRepository.findOne
        .mockResolvedValueOnce({
          groupId: 'group-1',
          userId: 'user-1',
          role: 'Propietario',
        })
        .mockResolvedValueOnce(null);
      mockGroupMemberRepository.create.mockReturnValue(membership);
      mockGroupMemberRepository.save.mockResolvedValue(membership);

      const result = await service.inviteMember('group-1', inviteDto, mockUser);

      expect(result).toEqual(membership);
    });

    it('should throw ConflictException if user already a member', async () => {
      const invitedUser: User = {
        id: 'user-2',
        nombre: 'New User',
        email: 'newuser@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        ownedGroups: [],
        groupMembership: [],
        animales: [],
        campaigns: [],
      };

      mockGroupMemberRepository.findOne
        .mockResolvedValueOnce({
          groupId: 'group-1',
          userId: 'user-1',
          role: 'Propietario',
        })
        .mockResolvedValueOnce({
          groupId: 'group-1',
          userId: 'user-2',
          role: 'Miembro',
        });

      mockUsersService.findOneByEmail.mockResolvedValue(invitedUser);

      await expect(
        service.inviteMember('group-1', inviteDto, mockUser),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should delete a group successfully', async () => {
      const group = {
        id: 'group-1',
        nombre: 'Test Group',
        propietario: mockUser,
      };

      mockGroupRepository.findOne.mockResolvedValue(group);
      mockGroupRepository.remove.mockResolvedValue(group);

      await service.remove('group-1', 'user-1');

      expect(mockGroupRepository.remove).toHaveBeenCalledWith(group);
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

      const group = {
        id: 'group-1',
        nombre: 'Test Group',
        propietario: otherUser,
      };

      mockGroupRepository.findOne.mockResolvedValue(group);

      await expect(service.remove('group-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});

