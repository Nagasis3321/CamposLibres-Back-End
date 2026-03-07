// Archivo: src/auth/auth.service.ts

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { AnimalsService } from '../animals/animals.service';
import { GroupsService } from '../groups/groups.service';
import { CampaignsService } from '../campaigns/campaigns.service';
import { Animal } from '../animals/entities/animal.entity';
import { Group } from '../groups/entities/group.entity';
import { GroupMember } from '../groups/entities/group-member.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => AnimalsService))
    private readonly animalsService: AnimalsService,
    @Inject(forwardRef(() => GroupsService))
    private readonly groupsService: GroupsService,
    @Inject(forwardRef(() => CampaignsService))
    private readonly campaignsService: CampaignsService,
    @InjectRepository(Animal)
    private readonly animalRepository: Repository<Animal>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private readonly groupMemberRepository: Repository<GroupMember>,
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
  ) {}

  async register(createUserDto: CreateUserDto) {
    try {
      return await this.usersService.create(createUserDto);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException('El correo electrónico ya está en uso.');
      }
      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.usersService.findOneByEmail(
      email.toLocaleLowerCase(),
    );

    if (!user || !(await bcrypt.compare(password, user.password!))) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userProfile } = user;
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken, user: userProfile };
  }

  /** Contraseña fija para usuario demo y usuarios de prueba (documentada para pruebas). */
  private static readonly DEMO_PASSWORD = 'Demo123!';

  async demoLogin() {
    const demoEmail = 'demo@example.com';
    let demoUser = await this.usersService.findOneByEmail(demoEmail);
    const isNewUser = !demoUser;

    if (!demoUser) {
      demoUser = await this.usersService.create({
        nombre: 'Usuario Demo',
        email: demoEmail,
        password: AuthService.DEMO_PASSWORD,
      }) as User;
      // Recargar para tener el usuario completo (p. ej. para createDemoData)
      demoUser = await this.usersService.findOneByEmail(demoEmail) ?? demoUser;
    }

    // Si es un usuario nuevo, crear datos de prueba (grupos, usuarios, 300+ animales)
    if (isNewUser) {
      await this.createDemoData(demoUser);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userProfile } = demoUser;
    const payload = { sub: demoUser.id, email: demoUser.email };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken, user: userProfile };
  }

  private async createDemoData(user: User): Promise<void> {
    const userEntity = { id: user.id } as User;
    const tiposMacho = ['Toro', 'Novillo', 'Ternero'];
    const tiposHembra = ['Vaca', 'Vaquilla', 'Ternera'];
    const pelajes = ['Blanco/a', 'Valla', 'Valla Mocha', 'Colorada Mocha', 'Pampa', 'Negra Cara Blanca', 'Osco', 'Barcina', 'Osca', 'Colorada', 'Baya'];
    const razas = ['Holando', 'Jersey', 'Angus', 'Hereford', 'Brahman'];

    const createAnimalesForUser = async (owner: User, count: number, prefix: string): Promise<Animal[]> => {
      const list: Animal[] = [];
      for (let i = 1; i <= count; i++) {
        const esMacho = Math.random() < 0.5;
        const sexo = esMacho ? 'Macho' : 'Hembra';
        const tipos = esMacho ? tiposMacho : tiposHembra;
        const animalData = this.animalRepository.create({
          caravana: `${prefix}-${String(i).padStart(3, '0')}`,
          tipoAnimal: tipos[Math.floor(Math.random() * tipos.length)],
          pelaje: pelajes[Math.floor(Math.random() * pelajes.length)],
          sexo,
          raza: razas[Math.floor(Math.random() * razas.length)],
          fechaNacimiento: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
          dueno: { id: owner.id } as User,
        });
        list.push(await this.animalRepository.save(animalData));
      }
      return list;
    };

    try {
      console.log('Iniciando creación de datos de prueba para usuario demo:', user.id);

      // Usuarios adicionales (nombres coinciden con ownerNombre del JSON de vacunación)
      const extraUsersConfig = [
        { nombre: 'Julio Terleski', email: 'julio.terleski@demo.com' },
        { nombre: 'Elio Terleski', email: 'elio.terleski@demo.com' },
        { nombre: 'Mariel Ojeda', email: 'mariel.ojeda@demo.com' },
        { nombre: 'Ramon Diaz', email: 'ramon.diaz@demo.com' },
      ];
      const members: User[] = [];
      for (const u of extraUsersConfig) {
        let us = await this.usersService.findOneByEmail(u.email);
        if (!us) {
          await this.usersService.create({
            nombre: u.nombre,
            email: u.email,
            password: AuthService.DEMO_PASSWORD,
          });
          us = await this.usersService.findOneByEmail(u.email);
        }
        if (us) members.push(us);
      }
      console.log('Usuarios de grupo creados o existentes:', members.length);

      // Grupo "Tres Islas" (propietario demo, miembros: demo + los 4)
      let grupoTresIslas = await this.groupRepository.findOne({ where: { nombre: 'Tres Islas' }, relations: ['miembros'] });
      if (!grupoTresIslas) {
        grupoTresIslas = this.groupRepository.create({
          nombre: 'Tres Islas',
          propietario: userEntity,
        });
        grupoTresIslas = await this.groupRepository.save(grupoTresIslas);
        await this.groupMemberRepository.save(
          this.groupMemberRepository.create({ group: grupoTresIslas, user: userEntity, role: 'Propietario' }),
        );
        for (const m of members) {
          await this.groupMemberRepository.save(
            this.groupMemberRepository.create({ group: grupoTresIslas!, user: m, role: 'Miembro' }),
          );
        }
        console.log('Grupo Tres Islas creado');
      }

      // Animales: 30, 80, 140, 200 para los 4 usuarios y 50 para demo (total 500, >300)
      const counts = [30, 80, 140, 200];
      const animalesPorUsuario: Animal[] = [];
      for (let i = 0; i < members.length && i < counts.length; i++) {
        const created = await createAnimalesForUser(members[i], counts[i], `DEMO-${i + 1}`);
        animalesPorUsuario.push(...created);
        console.log(`Creados ${counts[i]} animales para ${members[i].nombre}`);
      }
      const animalesDemo = await createAnimalesForUser(user, 50, 'DEMO-0');
      console.log('Creados 50 animales para Usuario Demo');
      const todosAnimales = [...animalesDemo, ...animalesPorUsuario];
      console.log('Total de animales creados:', todosAnimales.length);

      // Grupos adicionales
      const grupos: Group[] = [grupoTresIslas!];
      for (const nombre of ['Grupo Demo 2', 'Grupo Demo 3']) {
        let g = await this.groupRepository.findOne({ where: { nombre } });
        if (!g) {
          g = this.groupRepository.create({ nombre, propietario: userEntity });
          g = await this.groupRepository.save(g);
          await this.groupMemberRepository.save(
            this.groupMemberRepository.create({ group: g, user: userEntity, role: 'Propietario' }),
          );
          grupos.push(g);
        }
      }

      // Campañas de prueba (usando animales del demo y del grupo)
      const productosVacunacion = ['Vacuna Triple', 'Vacuna Aftosa', 'Vacuna Brucelosis', 'Vacuna Carbunco', 'Vacuna Rabia'];
      for (let i = 1; i <= 5; i++) {
        const numAnimales = Math.min(3 + Math.floor(Math.random() * 8), todosAnimales.length);
        const seleccionados = todosAnimales.sort(() => Math.random() - 0.5).slice(0, numAnimales);
        const fechaCampaña = new Date();
        fechaCampaña.setDate(fechaCampaña.getDate() - i * 30);
        const campaignData = this.campaignRepository.create({
          nombre: `Campaña de Vacunación Demo ${i}`,
          fecha: fechaCampaña.toISOString().split('T')[0],
          productosUtilizados: productosVacunacion[i - 1] || 'Vacuna Triple',
          observaciones: `Campaña de prueba ${i} para demostración`,
          animales: seleccionados,
          group: i <= 2 ? { id: grupoTresIslas!.id } as Group : undefined,
          propietario: userEntity,
        });
        await this.campaignRepository.save(campaignData);
      }
      console.log('Datos de prueba creados exitosamente (500+ animales, Tres Islas, 4 usuarios de grupo).');
    } catch (error) {
      console.error('Error creando datos de prueba para usuario demo:', error);
      if (error instanceof Error) console.error('Stack:', error.stack);
    }
  }

  // --- NUEVO MÉTODO PARA BORRAR USUARIO ---
  async deleteUser(id: string): Promise<void> {
    // Delega la lógica de borrado al servicio de usuarios.
    await this.usersService.remove(id);
  }
}
