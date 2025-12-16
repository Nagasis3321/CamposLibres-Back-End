import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnimalHistory, HistoryType } from './entities/animal-history.entity';
import { CreateAnimalHistoryDto } from './dto/create-animal-history.dto';
import { UpdateAnimalHistoryDto } from './dto/update-animal-history.dto';
import { User } from '../users/entities/user.entity';
import { Animal } from '../animals/entities/animal.entity';

@Injectable()
export class AnimalHistoryService {
  constructor(
    @InjectRepository(AnimalHistory)
    private readonly historyRepository: Repository<AnimalHistory>,
    @InjectRepository(Animal)
    private readonly animalRepository: Repository<Animal>,
  ) {}

  async create(
    createDto: CreateAnimalHistoryDto,
    currentUser: User,
  ): Promise<AnimalHistory> {
    const animal = await this.animalRepository.findOne({
      where: { id: createDto.animalId },
      relations: ['dueno'],
    });

    if (!animal) {
      throw new NotFoundException('Animal no encontrado.');
    }

    if (animal.dueno.id !== currentUser.id) {
      throw new ForbiddenException('No tienes permiso para crear historial de este animal.');
    }

    const history = this.historyRepository.create({
      ...createDto,
      animal: { id: createDto.animalId } as Animal,
      usuario: currentUser,
    });

    return this.historyRepository.save(history);
  }

  async findAll(animalId: string, userId: string): Promise<AnimalHistory[]> {
    const animal = await this.animalRepository.findOne({
      where: { id: animalId },
      relations: ['dueno'],
    });

    if (!animal) {
      throw new NotFoundException('Animal no encontrado.');
    }

    if (animal.dueno.id !== userId) {
      throw new ForbiddenException('No tienes permiso para ver el historial de este animal.');
    }

    return this.historyRepository.find({
      where: { animal: { id: animalId } },
      relations: ['usuario'],
      order: { fecha: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<AnimalHistory> {
    const history = await this.historyRepository.findOne({
      where: { id },
      relations: ['animal', 'animal.dueno', 'usuario'],
    });

    if (!history) {
      throw new NotFoundException('Registro de historial no encontrado.');
    }

    if (history.animal.dueno.id !== userId) {
      throw new ForbiddenException('No tienes permiso para ver este registro.');
    }

    return history;
  }

  async update(
    id: string,
    updateDto: UpdateAnimalHistoryDto,
    userId: string,
  ): Promise<AnimalHistory> {
    const history = await this.findOne(id, userId);

    Object.assign(history, updateDto);
    return this.historyRepository.save(history);
  }

  async remove(id: string, userId: string): Promise<void> {
    const history = await this.findOne(id, userId);
    await this.historyRepository.remove(history);
  }
}

