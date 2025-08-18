import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const { nombre, password } = createUserDto;
    // --- CAMBIO AQUÍ: Convertir el email a minúsculas ---
    const email = createUserDto.email.toLowerCase();
    // ----------------------------------------------------

    // Verificar si el usuario ya existe
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está en uso');
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear la nueva instancia de usuario
    const newUser = this.userRepository.create({
      nombre,
      email, // Se usa el email ya convertido a minúsculas
      password: hashedPassword,
    });

    // Guardar en la base de datos
    const savedUser = await this.userRepository.save(newUser);

    // No devolver la contraseña en la respuesta
    const { password: _, ...userWithoutPassword } = savedUser;
    return userWithoutPassword;
  }

  async findOneByEmail(email: string): Promise<User | null> {
    // La búsqueda también debe ser en minúsculas
    return this.userRepository.findOne({
      where: { email: email.toLowerCase() },
      select: ['id', 'nombre', 'email', 'password'],
    });
  }

  async findOneById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }
}
