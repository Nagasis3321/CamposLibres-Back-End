import { Test, TestingModule } from '@nestjs/testing';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { User } from '../users/entities/user.entity';

describe('GroupsController', () => {
  let controller: GroupsController;
  let service: GroupsService;

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

  const mockGroupsService = {
    create: jest.fn(),
    findAllForUser: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    inviteMember: jest.fn(),
    updateMemberRole: jest.fn(),
    removeMember: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupsController],
      providers: [
        {
          provide: GroupsService,
          useValue: mockGroupsService,
        },
      ],
    }).compile();

    controller = module.get<GroupsController>(GroupsController);
    service = module.get<GroupsService>(GroupsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateGroupDto = {
      nombre: 'Test Group',
    };

    it('should create a group', async () => {
      const expectedResult = {
        id: 'group-1',
        nombre: 'Test Group',
        propietario: mockUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGroupsService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto, mockRequest);

      expect(service.create).toHaveBeenCalledWith(createDto, mockUser);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAllForUser', () => {
    it('should return all groups for user', async () => {
      const expectedResult = [
        {
          id: 'group-1',
          nombre: 'Test Group',
          propietario: mockUser,
          miembros: [],
        },
      ];

      mockGroupsService.findAllForUser.mockResolvedValue(expectedResult);

      const result = await controller.findAllForUser(mockRequest);

      expect(service.findAllForUser).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a single group', async () => {
      const expectedResult = {
        id: 'group-1',
        nombre: 'Test Group',
        propietario: mockUser,
        miembros: [],
      };

      mockGroupsService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne('group-1', mockRequest);

      expect(service.findOne).toHaveBeenCalledWith('group-1', 'user-1');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    const updateDto: UpdateGroupDto = {
      nombre: 'Updated Group',
    };

    it('should update a group', async () => {
      const expectedResult = {
        id: 'group-1',
        nombre: 'Updated Group',
        propietario: mockUser,
        miembros: [],
      };

      mockGroupsService.update.mockResolvedValue(expectedResult);

      const result = await controller.update('group-1', updateDto, mockRequest);

      expect(service.update).toHaveBeenCalledWith('group-1', updateDto, 'user-1');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should delete a group', async () => {
      mockGroupsService.remove.mockResolvedValue(undefined);

      await controller.remove('group-1', mockRequest);

      expect(service.remove).toHaveBeenCalledWith('group-1', 'user-1');
    });
  });

  describe('inviteMember', () => {
    const inviteDto: InviteMemberDto = {
      email: 'newuser@example.com',
      role: 'Miembro',
    };

    it('should invite a member', async () => {
      const expectedResult = {
        groupId: 'group-1',
        userId: 'user-2',
        role: 'Miembro',
      };

      mockGroupsService.inviteMember.mockResolvedValue(expectedResult);

      const result = await controller.inviteMember('group-1', inviteDto, mockRequest);

      expect(service.inviteMember).toHaveBeenCalledWith('group-1', inviteDto, mockUser);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('updateMemberRole', () => {
    const updateDto: UpdateMemberRoleDto = {
      role: 'Administrador',
    };

    it('should update member role', async () => {
      const expectedResult = {
        groupId: 'group-1',
        userId: 'user-2',
        role: 'Administrador',
      };

      mockGroupsService.updateMemberRole.mockResolvedValue(expectedResult);

      const result = await controller.updateMemberRole('group-1', 'user-2', updateDto, mockRequest);

      expect(service.updateMemberRole).toHaveBeenCalledWith('group-1', 'user-2', updateDto, 'user-1');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('removeMember', () => {
    it('should remove a member', async () => {
      const expectedResult = { message: 'Miembro eliminado correctamente.' };

      mockGroupsService.removeMember.mockResolvedValue(expectedResult);

      const result = await controller.removeMember('group-1', 'user-2', mockRequest);

      expect(service.removeMember).toHaveBeenCalledWith('group-1', 'user-2', 'user-1');
      expect(result).toEqual(expectedResult);
    });
  });
});
