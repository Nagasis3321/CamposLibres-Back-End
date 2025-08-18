import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Animal } from './entities/animal.entity';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';
import { User } from '../users/entities/user.entity';
import { GroupsService } from '../groups/groups.service';
import { UpdateAnimalRelationsDto } from './dto/update-animal-relations.dto';
import { PaginationQueryDto } from './dto/query-animal.dto';

@Injectable()
export class AnimalsService {
  constructor(
    @InjectRepository(Animal)
    private readonly animalRepository: Repository<Animal>,
    private readonly groupsService: GroupsService,
  ) {}

  async create(
    createAnimalDto: CreateAnimalDto,
    currentUser: User,
  ): Promise<Animal> {
    let duenoId = currentUser.id;

    if (createAnimalDto.duenoId && createAnimalDto.duenoId !== currentUser.id) {
      const ownerId = createAnimalDto.duenoId;
      const hasPermission =
        await this.groupsService.usersShareGroupWithAdminRole(
          currentUser.id,
          ownerId,
        );

      if (!hasPermission) {
        throw new ForbiddenException(
          'No tienes permiso para registrar un animal a nombre de este dueño.',
        );
      }
      duenoId = ownerId;
    }

    const newAnimal = this.animalRepository.create({
      ...createAnimalDto,
      dueno: { id: duenoId } as User,
    });

    return this.animalRepository.save(newAnimal);
  }

  

  async findOne(animalId: string, userId: string): Promise<Animal> {
    const animal = await this.animalRepository.findOne({
      where: { id: animalId },
      relations: ['dueno'],
    });

    if (!animal) {
      throw new NotFoundException('Animal no encontrado.');
    }

    if (animal.dueno.id !== userId) {
      throw new ForbiddenException('No tienes permiso para ver este animal.');
    }
    return animal;
  }

  async update(
    animalId: string,
    updateDto: UpdateAnimalDto,
    userId: string,
  ): Promise<Animal> {
    const animal = await this.findOne(animalId, userId);
    Object.assign(animal, updateDto);
    return this.animalRepository.save(animal);
  }

  async updateRelations(
    childId: string,
    relationsDto: UpdateAnimalRelationsDto,
    userId: string,
  ): Promise<Animal> {
    const child = await this.findOne(childId, userId);

    if (relationsDto.idMadre !== undefined) {
      if (relationsDto.idMadre === null) {
        child.idMadre = undefined; // Asigna null para borrar la relación
      } else {
        const mother = await this.animalRepository.findOneBy({ id: relationsDto.idMadre });
        if (!mother) throw new NotFoundException('La madre especificada no existe.');
        if (mother.sexo !== 'Hembra') throw new ForbiddenException('El animal especificado como madre no es hembra.');
        child.idMadre = mother.id;
      }
    }

    if (relationsDto.idPadre !== undefined) {
      if (relationsDto.idPadre === null) {
        child.idPadre = undefined; // Asigna null para borrar la relación
      } else {
        const father = await this.animalRepository.findOneBy({ id: relationsDto.idPadre });
        if (!father) throw new NotFoundException('El padre especificado no existe.');
        if (father.sexo !== 'Macho') throw new ForbiddenException('El animal especificado como padre no es macho.');
        child.idPadre = father.id;
      }
    }

    return this.animalRepository.save(child);
  }


  

  async getFamilyRelations(animalId: string, userId: string) {
    const animal = await this.findOne(animalId, userId); // Valida permisos

    let mother: Animal | null = null;
    if (animal.idMadre) {
      mother = await this.animalRepository.findOneBy({ id: animal.idMadre });
    }

    let father: Animal | null = null;
    if (animal.idPadre) {
      father = await this.animalRepository.findOneBy({ id: animal.idPadre });
    }

    const children = await this.animalRepository.find({
      where: [{ idMadre: animal.id }, { idPadre: animal.id }],
    });

    return {
      animal,
      madre: mother,
      padre: father,
      crias: children,
    };
  }


  async remove(animalId: string, userId: string): Promise<void> {
    const animal = await this.findOne(animalId, userId);
    await this.animalRepository.remove(animal);
  }

  async findAllForUser(user: User, paginationDto: PaginationQueryDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.animalRepository.findAndCount({
      where: { dueno: { id: user.id } },
      skip: skip,
      take: limit,
      relations: ['dueno'],
    });

    return { data, total, page, limit };
  }

  async findAllForGroup(
    user: User,
    groupId: string,
    paginationDto: PaginationQueryDto,
  ) {
    // Paso 1: Verificar que el usuario pertenece al grupo
    await this.groupsService.findOne(groupId, user.id);

    // Paso 2: Obtener los animales del grupo
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const query = this.animalRepository
      .createQueryBuilder('animal')
      .innerJoin('animal.dueno', 'dueno')
      .innerJoin('dueno.groupMembership', 'membership')
      .where('membership.groupId = :groupId', { groupId });

    const [data, total] = await query
      .leftJoinAndSelect('animal.dueno', 'dueno_details')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }
  
}
