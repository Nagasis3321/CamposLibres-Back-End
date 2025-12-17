import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Birth } from './entities/birth.entity';
import { CreateBirthDto } from './dto/create-birth.dto';
import { UpdateBirthDto } from './dto/update-birth.dto';
import { User } from '../users/entities/user.entity';
import { Animal } from '../animals/entities/animal.entity';

@Injectable()
export class BirthsService {
  constructor(
    @InjectRepository(Birth)
    private readonly birthRepository: Repository<Birth>,
    @InjectRepository(Animal)
    private readonly animalRepository: Repository<Animal>,
  ) {}

  async create(
    createDto: CreateBirthDto,
    currentUser: User,
  ): Promise<Birth> {
    const madre = await this.animalRepository.findOne({
      where: { id: createDto.madreId },
      relations: ['dueno'],
    });

    if (!madre) {
      throw new NotFoundException('Madre no encontrada.');
    }

    if (madre.dueno.id !== currentUser.id) {
      throw new ForbiddenException('No tienes permiso para crear parto de este animal.');
    }

    if (madre.sexo !== 'Hembra') {
      throw new ForbiddenException('El animal especificado no es hembra.');
    }

    let cria: Animal | undefined;
    if (createDto.criaId) {
      const criaFound = await this.animalRepository.findOne({
        where: { id: createDto.criaId },
        relations: ['dueno'],
      });
      cria = criaFound ?? undefined;

      if (!cria) {
        throw new NotFoundException('Cría no encontrada.');
      }

      if (cria.dueno.id !== currentUser.id) {
        throw new ForbiddenException('No tienes permiso para asociar esta cría.');
      }
    } else {
      // Si no se especifica criaId, crear un nuevo animal automáticamente
      const sexoCria = createDto.sexoCria || 'Macho';
      const tipoAnimal = sexoCria === 'Hembra' ? 'Ternera' : 'Ternero';
      
      const newCria = this.animalRepository.create({
        tipoAnimal: tipoAnimal,
        pelaje: madre.pelaje, // Heredar pelaje de la madre por defecto
        sexo: sexoCria,
        fechaNacimiento: createDto.fecha,
        idMadre: madre.id,
        dueno: currentUser,
        descripcion: `Cría registrada automáticamente el ${createDto.fecha}`,
      });
      
      const savedCria = await this.animalRepository.save(newCria);
      cria = savedCria;
    }

    const birth = this.birthRepository.create({
      ...createDto,
      madre: { id: createDto.madreId } as Animal,
      cria: cria ? { id: cria.id } as Animal : undefined,
      usuario: currentUser,
      estado: createDto.estado || 'VIVO',
    });

    return this.birthRepository.save(birth);
  }

  async findAll(animalId: string, userId: string): Promise<Birth[]> {
    const animal = await this.animalRepository.findOne({
      where: { id: animalId },
      relations: ['dueno'],
    });

    if (!animal) {
      throw new NotFoundException('Animal no encontrado.');
    }

    if (animal.dueno.id !== userId) {
      throw new ForbiddenException('No tienes permiso para ver los partos de este animal.');
    }

    return this.birthRepository.find({
      where: { madre: { id: animalId } },
      relations: ['madre', 'cria', 'usuario'],
      order: { fecha: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Birth> {
    const birth = await this.birthRepository.findOne({
      where: { id },
      relations: ['madre', 'madre.dueno', 'cria', 'usuario'],
    });

    if (!birth) {
      throw new NotFoundException('Parto no encontrado.');
    }

    if (birth.madre.dueno.id !== userId) {
      throw new ForbiddenException('No tienes permiso para ver este parto.');
    }

    return birth;
  }

  async update(
    id: string,
    updateDto: UpdateBirthDto,
    userId: string,
  ): Promise<Birth> {
    const birth = await this.findOne(id, userId);

    if (updateDto.criaId) {
      const cria = await this.animalRepository.findOne({
        where: { id: updateDto.criaId },
        relations: ['dueno'],
      });

      if (!cria) {
        throw new NotFoundException('Cría no encontrada.');
      }

      if (cria.dueno.id !== userId) {
        throw new ForbiddenException('No tienes permiso para asociar esta cría.');
      }

      birth.cria = cria;
    }

    Object.assign(birth, updateDto);
    return this.birthRepository.save(birth);
  }

  async remove(id: string, userId: string): Promise<void> {
    const birth = await this.findOne(id, userId);
    await this.birthRepository.remove(birth);
  }
}

