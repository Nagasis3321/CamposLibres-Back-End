import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnimalState } from './entities/animal-state.entity';
import { CreateAnimalStateDto } from './dto/create-animal-state.dto';
import { UpdateAnimalStateDto } from './dto/update-animal-state.dto';
import { User } from '../users/entities/user.entity';
import { Animal } from '../animals/entities/animal.entity';

@Injectable()
export class AnimalStatesService {
  constructor(
    @InjectRepository(AnimalState)
    private readonly stateRepository: Repository<AnimalState>,
    @InjectRepository(Animal)
    private readonly animalRepository: Repository<Animal>,
  ) {}

  async create(
    createDto: CreateAnimalStateDto,
    currentUser: User,
  ): Promise<AnimalState> {
    const animal = await this.animalRepository.findOne({
      where: { id: createDto.animalId },
      relations: ['dueno'],
    });

    if (!animal) {
      throw new NotFoundException('Animal no encontrado.');
    }

    if (animal.dueno.id !== currentUser.id) {
      throw new ForbiddenException('No tienes permiso para crear estado de este animal.');
    }

    // Si hay un estado activo del mismo tipo, desactivarlo
    if (createDto.activo !== false) {
      await this.stateRepository.update(
        { animal: { id: createDto.animalId }, tipo: createDto.tipo, activo: true },
        { activo: false, fechaFin: createDto.fechaInicio },
      );
    }

    const state = this.stateRepository.create({
      ...createDto,
      animal: { id: createDto.animalId } as Animal,
      usuario: currentUser,
      activo: createDto.activo ?? true,
    });

    return this.stateRepository.save(state);
  }

  async findAll(animalId: string, userId: string): Promise<AnimalState[]> {
    const animal = await this.animalRepository.findOne({
      where: { id: animalId },
      relations: ['dueno'],
    });

    if (!animal) {
      throw new NotFoundException('Animal no encontrado.');
    }

    if (animal.dueno.id !== userId) {
      throw new ForbiddenException('No tienes permiso para ver los estados de este animal.');
    }

    return this.stateRepository.find({
      where: { animal: { id: animalId } },
      relations: ['usuario'],
      order: { fechaInicio: 'DESC' },
    });
  }

  async findActive(animalId: string, userId: string): Promise<AnimalState[]> {
    const animal = await this.animalRepository.findOne({
      where: { id: animalId },
      relations: ['dueno'],
    });

    if (!animal) {
      throw new NotFoundException('Animal no encontrado.');
    }

    if (animal.dueno.id !== userId) {
      throw new ForbiddenException('No tienes permiso para ver los estados de este animal.');
    }

    return this.stateRepository.find({
      where: { animal: { id: animalId }, activo: true },
      relations: ['usuario'],
      order: { fechaInicio: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<AnimalState> {
    const state = await this.stateRepository.findOne({
      where: { id },
      relations: ['animal', 'animal.dueno', 'usuario'],
    });

    if (!state) {
      throw new NotFoundException('Estado no encontrado.');
    }

    if (state.animal.dueno.id !== userId) {
      throw new ForbiddenException('No tienes permiso para ver este estado.');
    }

    return state;
  }

  async update(
    id: string,
    updateDto: UpdateAnimalStateDto,
    userId: string,
  ): Promise<AnimalState> {
    const state = await this.findOne(id, userId);

    Object.assign(state, updateDto);
    return this.stateRepository.save(state);
  }

  async remove(id: string, userId: string): Promise<void> {
    const state = await this.findOne(id, userId);
    await this.stateRepository.remove(state);
  }
}

