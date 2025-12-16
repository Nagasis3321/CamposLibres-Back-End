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

  async demoLogin() {
    const demoEmail = 'demo@example.com';
    let demoUser = await this.usersService.findOneByEmail(demoEmail);
    const isNewUser = !demoUser;

    if (!demoUser) {
      const demoPassword = Math.random().toString(36).slice(-12);
      demoUser = await this.usersService.create({
        nombre: 'Usuario Demo',
        email: demoEmail,
        password: demoPassword,
      });
    }

    // Si es un usuario nuevo, crear datos de prueba
    if (isNewUser) {
      await this.createDemoData(demoUser);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userProfile } = demoUser;
    const payload = { sub: demoUser.id, email: demoUser.email };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken, user: userProfile };
  }

  private async createDemoData(user: any): Promise<void> {
    try {
      console.log('Iniciando creación de datos de prueba para usuario demo:', user.id);
      
      // Asegurarse de que el usuario tenga la estructura correcta
      const userEntity = { id: user.id } as User;
      
      // Crear animales de prueba (50 animales) usando repositorio directamente
      const animales: Animal[] = [];
      const tiposAnimal = ['Vaca', 'Vaquilla', 'Ternero', 'Ternera', 'Novillo', 'Toro'];
      const pelajes = ['Blanco/a', 'Valla', 'Valla Mocha', 'Colorada Mocha', 'Pampa', 'Negra Cara Blanca', 'Osco'];
      const sexos = ['Hembra', 'Macho'];
      const razas = ['Holando', 'Jersey', 'Angus', 'Hereford', 'Brahman'];

      console.log('Creando 50 animales de prueba...');
      for (let i = 1; i <= 50; i++) {
        try {
          const tipoIndex = Math.floor(Math.random() * tiposAnimal.length);
          const pelajeIndex = Math.floor(Math.random() * pelajes.length);
          const sexoIndex = Math.floor(Math.random() * sexos.length);
          const razaIndex = Math.floor(Math.random() * razas.length);
          
          const animalData = this.animalRepository.create({
            caravana: `DEMO-${String(i).padStart(3, '0')}`,
            tipoAnimal: tiposAnimal[tipoIndex],
            pelaje: pelajes[pelajeIndex],
            sexo: sexos[sexoIndex],
            raza: razas[razaIndex],
            fechaNacimiento: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
            dueno: userEntity,
          });
          
          const animal = await this.animalRepository.save(animalData);
          animales.push(animal);
          
          if (i % 10 === 0) {
            console.log(`Creados ${i} animales...`);
          }
        } catch (error) {
          console.error(`Error creando animal ${i}:`, error);
        }
      }
      console.log(`Total de animales creados: ${animales.length}`);

      // Crear grupos de prueba (2 grupos) usando repositorio directamente
      const grupos: Group[] = [];
      console.log('Creando 2 grupos de prueba...');
      for (let i = 1; i <= 2; i++) {
        try {
          const grupoData = this.groupRepository.create({
            nombre: `Grupo Demo ${i}`,
            propietario: userEntity,
          });
          
          const grupo = await this.groupRepository.save(grupoData);
          
          // Crear membresía del propietario
          const membership = this.groupMemberRepository.create({
            group: grupo,
            user: userEntity,
            role: 'Propietario',
          });
          await this.groupMemberRepository.save(membership);
          
          grupos.push(grupo);
          console.log(`Grupo ${i} creado:`, grupo.id);
        } catch (error) {
          console.error(`Error creando grupo ${i}:`, error);
        }
      }
      console.log(`Total de grupos creados: ${grupos.length}`);

      // Crear campañas de vacunación de prueba (5 campañas) usando repositorio directamente
      console.log('Creando 5 campañas de vacunación de prueba...');
      const productosVacunacion = ['Vacuna Triple', 'Vacuna Aftosa', 'Vacuna Brucelosis', 'Vacuna Carbunco', 'Vacuna Rabia'];
      
      for (let i = 1; i <= 5; i++) {
        try {
          if (animales.length >= 3 && grupos.length > 0) {
            // Seleccionar entre 3 y 10 animales aleatorios para cada campaña
            const numAnimales = Math.min(3 + Math.floor(Math.random() * 8), animales.length);
            const animalesSeleccionados = animales
              .sort(() => Math.random() - 0.5)
              .slice(0, numAnimales);
            
            // Asignar a un grupo aleatorio o sin grupo
            const grupoSeleccionado = i <= 2 ? grupos[Math.floor(Math.random() * grupos.length)] : null;
            
            const fechaCampaña = new Date();
            fechaCampaña.setDate(fechaCampaña.getDate() - (i * 30)); // Campañas con 30 días de diferencia
            
            const campaignData = this.campaignRepository.create({
              nombre: `Campaña de Vacunación Demo ${i}`,
              fecha: fechaCampaña.toISOString().split('T')[0],
              productosUtilizados: productosVacunacion[i - 1] || 'Vacuna Triple',
              observaciones: `Campaña de prueba ${i} para demostración`,
              animales: animalesSeleccionados,
              group: grupoSeleccionado ? { id: grupoSeleccionado.id } as Group : undefined,
              propietario: grupoSeleccionado ? undefined : userEntity,
            });
            
            await this.campaignRepository.save(campaignData);
            console.log(`Campaña ${i} creada con ${numAnimales} animales`);
          }
        } catch (error) {
          console.error(`Error creando campaña ${i}:`, error);
        }
      }
      console.log('Datos de prueba creados exitosamente');
    } catch (error) {
      // Si hay error creando datos de prueba, no fallar el login
      console.error('Error creando datos de prueba para usuario demo:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack available');
    }
  }

  // --- NUEVO MÉTODO PARA BORRAR USUARIO ---
  async deleteUser(id: string): Promise<void> {
    // Delega la lógica de borrado al servicio de usuarios.
    await this.usersService.remove(id);
  }
}
