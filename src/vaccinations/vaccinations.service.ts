import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vaccination } from './entities/vaccination.entity';
import { CreateVaccinationDto } from './dto/create-vaccination.dto';
import { UpdateVaccinationDto } from './dto/update-vaccination.dto';
import { User } from '../users/entities/user.entity';
import { Animal } from '../animals/entities/animal.entity';

@Injectable()
export class VaccinationsService {
  constructor(
    @InjectRepository(Vaccination)
    private readonly vaccinationRepository: Repository<Vaccination>,
    @InjectRepository(Animal)
    private readonly animalRepository: Repository<Animal>,
  ) {}

  async create(
    createDto: CreateVaccinationDto,
    currentUser: User,
  ): Promise<Vaccination> {
    const animal = await this.animalRepository.findOne({
      where: { id: createDto.animalId },
      relations: ['dueno'],
    });

    if (!animal) {
      throw new NotFoundException('Animal no encontrado.');
    }

    if (animal.dueno.id !== currentUser.id) {
      throw new ForbiddenException('No tienes permiso para crear vacunación de este animal.');
    }

    const vaccination = this.vaccinationRepository.create({
      ...createDto,
      animal: { id: createDto.animalId } as Animal,
      usuario: currentUser,
    });

    return this.vaccinationRepository.save(vaccination);
  }

  async findAll(animalId: string, userId: string): Promise<Vaccination[]> {
    const animal = await this.animalRepository.findOne({
      where: { id: animalId },
      relations: ['dueno'],
    });

    if (!animal) {
      throw new NotFoundException('Animal no encontrado.');
    }

    if (animal.dueno.id !== userId) {
      throw new ForbiddenException('No tienes permiso para ver las vacunaciones de este animal.');
    }

    return this.vaccinationRepository.find({
      where: { animal: { id: animalId } },
      relations: ['usuario'],
      order: { fecha: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Vaccination> {
    const vaccination = await this.vaccinationRepository.findOne({
      where: { id },
      relations: ['animal', 'animal.dueno', 'usuario'],
    });

    if (!vaccination) {
      throw new NotFoundException('Vacunación no encontrada.');
    }

    if (vaccination.animal.dueno.id !== userId) {
      throw new ForbiddenException('No tienes permiso para ver esta vacunación.');
    }

    return vaccination;
  }

  async update(
    id: string,
    updateDto: UpdateVaccinationDto,
    userId: string,
  ): Promise<Vaccination> {
    const vaccination = await this.findOne(id, userId);

    Object.assign(vaccination, updateDto);
    return this.vaccinationRepository.save(vaccination);
  }

  async remove(id: string, userId: string): Promise<void> {
    const vaccination = await this.findOne(id, userId);
    await this.vaccinationRepository.remove(vaccination);
  }
}

