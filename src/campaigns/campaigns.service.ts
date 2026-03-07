import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Campaign } from './entities/campaign.entity';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { ImportVaccinationDto } from './dto/import-vaccination.dto';
import { ResolveImportDto } from './dto/resolve-import.dto';
import { User } from '../users/entities/user.entity';
import { GroupsService } from '../groups/groups.service';
import { AnimalsService } from '../animals/animals.service';
import { UsersService } from '../users/users.service';
import { Animal } from '../animals/entities/animal.entity';

const TIPOS_ANIMAL_VALIDOS = ['Vaca', 'Vaquilla', 'Ternero', 'Ternera', 'Novillo', 'Toro'] as const;
const MAP_TIPO: Record<string, string> = {
  Novillito: 'Novillo',
  VAQUILLA: 'Vaquilla',
  TERNERO: 'Ternero',
  TERNERA: 'Ternera',
  VACA: 'Vaca',
  NOVILLO: 'Novillo',
  TORO: 'Toro',
  TOPO: 'Toro',
  VARA: 'Novillo',
  BAJON: 'Novillo',
};

function normalizarTipoAnimal(tipo: string): string {
  const trimmed = (tipo || '').trim();
  if (MAP_TIPO[trimmed]) return MAP_TIPO[trimmed];
  if (TIPOS_ANIMAL_VALIDOS.includes(trimmed as any)) return trimmed;
  const capitalizado = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  if (TIPOS_ANIMAL_VALIDOS.includes(capitalizado as any)) return capitalizado;
  if (capitalizado === 'Novillito') return 'Novillo';
  return capitalizado || 'Vaca';
}

function inferirSexo(tipoAnimal: string): 'Hembra' | 'Macho' {
  const t = tipoAnimal.toLowerCase();
  if (['vaca', 'vaquilla', 'ternera'].includes(t)) return 'Hembra';
  return 'Macho';
}

/** Unifica formato de pelaje: primera letra de cada palabra en mayúscula, resto en minúscula (ej: OSCA → Osca, COLORADA PAMPA → Colorada Pampa). */
function normalizarPelaje(pelaje: string): string {
  const trimmed = (pelaje || '').trim();
  if (!trimmed) return 'Sin especificar';
  return trimmed
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(Animal)
    private readonly animalRepository: Repository<Animal>,
    private readonly groupsService: GroupsService,
    private readonly animalsService: AnimalsService,
    private readonly usersService: UsersService,
  ) {}

  async create(createDto: CreateCampaignDto, user: User): Promise<Campaign> {
    const { groupId, animalesIds, ...campaignData } = createDto;

    const campaign = this.campaignRepository.create(campaignData);
    const animales = animalesIds.length > 0
      ? await this.animalRepository.findBy({ id: In(animalesIds) })
      : [];
    // No fallar si algún id no existe: se guarda la campaña con los animales encontrados
    campaign.animales = animales;

    campaign.propietario = user; // Usuario que registra la campaña (personal o de grupo)
    if (groupId) {
      await this.groupsService.findOne(groupId, user.id); // Valida que el usuario pertenezca al grupo
      campaign.group = { id: groupId } as any;
    }

    return this.campaignRepository.save(campaign);
  }

  async findAllForUser(userId: string): Promise<Campaign[]> {
    const userCampaigns = await this.campaignRepository.find({
      where: { propietario: { id: userId } },
      relations: ['animales', 'animales.dueno', 'propietario'],
    });

    const groupCampaigns = await this.campaignRepository
      .createQueryBuilder('campaign')
      .innerJoin('campaign.group', 'group')
      .innerJoin('group.miembros', 'member', 'member.userId = :userId', { userId })
      .leftJoinAndSelect('campaign.animales', 'animales')
      .leftJoinAndSelect('animales.dueno', 'dueno')
      .leftJoinAndSelect('campaign.group', 'groupDetails')
      .leftJoinAndSelect('campaign.propietario', 'propietario')
      .getMany();

    return [...userCampaigns, ...groupCampaigns];
  }

  async findAllForGroup(groupId: string, userId: string): Promise<Campaign[]> {
    await this.groupsService.findOne(groupId, userId); // Validar pertenencia
    return this.campaignRepository.find({
        where: { group: { id: groupId } },
        relations: ['animales', 'animales.dueno', 'group', 'propietario']
    });
  }

  /** Campañas en las que participa un animal (el usuario debe tener acceso). */
  async findAllByAnimal(animalId: string, userId: string): Promise<Campaign[]> {
    const all = await this.findAllForUser(userId);
    return all.filter(
      (c) => c.animales && c.animales.some((a) => a.id === animalId),
    );
  }

  async findOne(id: string, userId: string): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({
      where: { id },
      relations: ['propietario', 'group', 'group.miembros', 'animales', 'animales.dueno'],
    });
    if (!campaign) throw new NotFoundException('Campaña no encontrada.');

    const isOwner = campaign.propietario?.id === userId;
    const isMember = campaign.group?.miembros.some(m => m.userId === userId);

    if (!isOwner && !isMember) {
      throw new ForbiddenException('No tienes acceso a esta campaña.');
    }
    return campaign;
  }
  
  async update(id: string, updateDto: UpdateCampaignDto, user: User): Promise<Campaign> {
    const campaign = await this.findOne(id, user.id);
    
    if (updateDto.animalesIds !== undefined) {
      const ids = updateDto.animalesIds;
      const animales = ids.length > 0
        ? await this.animalRepository.findBy({ id: In(ids) })
        : [];
      // No fallar si algún id no existe: se actualiza con los animales encontrados
      campaign.animales = animales;
    }

    const { animalesIds, ...campaignData } = updateDto;
    Object.assign(campaign, campaignData);
    return this.campaignRepository.save(campaign);
  }

  async remove(id: string, user: User): Promise<void> {
    const campaign = await this.findOne(id, user.id);
    await this.campaignRepository.remove(campaign);
  }

  /**
   * Resuelve el JSON de vacunación: crea o relaciona animales por dueño, sin crear la campaña.
   * Si un dueño no está identificado o no se asocia, se usa un dueño por defecto (usuario actual o primer miembro del grupo)
   * y se crea el animal igualmente. Todos los registros terminan como animales creados o encontrados.
   */
  async resolveImportVaccination(
    dto: ResolveImportDto,
    currentUser: User,
  ): Promise<{ animals: Animal[]; noIdentificados: Array<{ caravana: string; tipoAnimal: string; pelaje: string; ownerNombre: string }> }> {
    const groupId = dto.groupId;
    const ownerMapping = dto.ownerMapping || {};

    let allowedOwnerIds: Set<string> | null = null;
    let memberIds: string[] = [];
    if (groupId) {
      const group = await this.groupsService.findOne(groupId, currentUser.id);
      memberIds = (group.miembros || [])
        .map((m: any) => m.userId ?? m.user?.id)
        .filter(Boolean);
      allowedOwnerIds = new Set(memberIds);
    }

    const ownersMap = new Map<string, User>();

    if (Object.keys(ownerMapping).length > 0) {
      for (const [ownerNombre, userId] of Object.entries(ownerMapping)) {
        const key = ownerNombre.trim();
        if (!key || !userId) continue;
        if (allowedOwnerIds && !allowedOwnerIds.has(userId)) continue;
        try {
          const user = await this.usersService.findOneById(userId);
          ownersMap.set(key, user as User);
        } catch {
          // Usuario no encontrado
        }
      }
    } else {
      const nombresUnicos = [...new Set(dto.registros.map((r) => r.ownerNombre.trim()))];
      for (const nombre of nombresUnicos) {
        const user = await this.usersService.findByNombre(nombre);
        if (!user) continue;
        if (allowedOwnerIds && !allowedOwnerIds.has((user as User).id)) continue;
        ownersMap.set(nombre, user as User);
      }
    }

    // Dueño por defecto cuando no se identifica: usuario actual o primer miembro del grupo
    let fallbackOwner: User = currentUser;
    if (groupId && memberIds.length > 0) {
      try {
        const first = await this.usersService.findOneById(memberIds[0]);
        fallbackOwner = first as User;
      } catch {
        // mantener currentUser
      }
    }

    const animals: Animal[] = [];
    const noIdentificados: Array<{ caravana: string; tipoAnimal: string; pelaje: string; ownerNombre: string }> = [];

    for (const reg of dto.registros) {
      const owner = ownersMap.get(reg.ownerNombre.trim()) || fallbackOwner;
      const pelaje = normalizarPelaje(reg.pelaje ?? '');
      const tipoNormalizado = normalizarTipoAnimal(reg.tipoAnimal);
      const tipoFinal = TIPOS_ANIMAL_VALIDOS.includes(tipoNormalizado as any) ? tipoNormalizado : 'Vaca';
      const sexo = inferirSexo(tipoFinal);

      let animal = await this.animalRepository.findOne({
        where: { caravana: reg.caravana, dueno: { id: owner.id } },
        relations: ['dueno'],
      });

      if (!animal) {
        animal = await this.animalsService.create(
          {
            caravana: reg.caravana,
            tipoAnimal: tipoFinal,
            pelaje,
            sexo,
            duenoId: owner.id,
          },
          currentUser,
        );
        animal.dueno = owner;
      }
      animals.push(animal);
    }

    return { animals, noIdentificados };
  }

  /**
   * Importa una campaña de vacunación desde JSON: resuelve dueños por nombre,
   * busca o crea animales por caravana + dueño y crea la campaña con fecha y animales.
   */
  async importVaccination(dto: ImportVaccinationDto, currentUser: User): Promise<Campaign> {
    const nombresUnicos = [...new Set(dto.registros.map((r) => r.ownerNombre.trim()))];
    const ownersMap = new Map<string, User>();
    for (const nombre of nombresUnicos) {
      const user = await this.usersService.findByNombre(nombre);
      if (!user) {
        throw new BadRequestException(
          `No existe ningún usuario con el nombre "${nombre}". Debe existir en el sistema para asignar animales.`,
        );
      }
      ownersMap.set(nombre, user as User);
    }

    const animalIds: string[] = [];
    for (const reg of dto.registros) {
      const owner = ownersMap.get(reg.ownerNombre.trim());
      if (!owner) continue;

      const tipoNormalizado = normalizarTipoAnimal(reg.tipoAnimal);
      if (!TIPOS_ANIMAL_VALIDOS.includes(tipoNormalizado as any)) {
        throw new BadRequestException(
          `Tipo de animal inválido: "${reg.tipoAnimal}" (caravana ${reg.caravana}). Valores permitidos: ${TIPOS_ANIMAL_VALIDOS.join(', ')}.`,
        );
      }

      const pelaje = normalizarPelaje(reg.pelaje ?? '');
      const sexo = inferirSexo(tipoNormalizado);

      let animal = await this.animalRepository.findOne({
        where: { caravana: reg.caravana, dueno: { id: owner.id } },
        relations: ['dueno'],
      });

      if (!animal) {
        animal = await this.animalsService.create(
          {
            caravana: reg.caravana,
            tipoAnimal: tipoNormalizado,
            pelaje,
            sexo,
            duenoId: owner.id,
          },
          currentUser,
        );
      }
      animalIds.push(animal.id);
    }

    if (animalIds.length === 0) {
      throw new BadRequestException('No hay registros válidos para importar.');
    }

    const nombreCampana =
      dto.nombreCampana?.trim() ||
      `Vacunación ${dto.fechaVacunacion}`;
    const fecha =
      dto.fechaVacunacion.includes('T') || dto.fechaVacunacion.length === 10
        ? dto.fechaVacunacion.slice(0, 10)
        : dto.fechaVacunacion;

    return this.create(
      {
        nombre: nombreCampana,
        fecha,
        animalesIds: animalIds,
      },
      currentUser,
    );
  }
}
