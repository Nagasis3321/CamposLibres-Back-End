import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
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

  async findAll(page: number = 1, limit: number = 10): Promise<{ data: Omit<User, 'password'>[], total: number, page: number, limit: number }> {
    const [users, total] = await this.userRepository.findAndCount({
      take: limit,
      skip: (page - 1) * limit,
      order: { createdAt: 'DESC' },
      select: ['id', 'nombre', 'email', 'createdAt', 'updatedAt'],
    });

    return {
      data: users,
      total,
      page,
      limit,
    };
  }

  async searchByEmail(email: string): Promise<Omit<User, 'password'>[]> {
    const users = await this.userRepository.find({
      where: { email: Like(`%${email.toLowerCase()}%`) },
      select: ['id', 'nombre', 'email', 'createdAt', 'updatedAt'],
      take: 10, // Limitar resultados
    });

    return users;
  }

  async findOneByEmail(email: string): Promise<User | null> {
    // La búsqueda también debe ser en minúsculas
    return this.userRepository.findOne({
      where: { email: email.toLowerCase() },
      select: ['id', 'nombre', 'email', 'password'],
    });
  }

  async findOneById(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findOne({ 
      where: { id },
      select: ['id', 'nombre', 'email', 'createdAt', 'updatedAt'],
    });
    
    if (!user) {
      throw new NotFoundException(`Usuario con ID "${id}" no encontrado.`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException(`Usuario con ID "${id}" no encontrado.`);
    }

    // Si se está actualizando el email, verificar que no esté en uso
    if (updateUserDto.email) {
      const email = updateUserDto.email.toLowerCase();
      const existingUser = await this.userRepository.findOne({ 
        where: { email },
      });
      
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('El correo electrónico ya está en uso');
      }
      
      updateUserDto.email = email;
    }

    // Si se está actualizando la contraseña, hashearla
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    Object.assign(user, updateUserDto);
    const updatedUser = await this.userRepository.save(user);

    // No devolver la contraseña
    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userRepository.delete(id);

    // El método `delete` de TypeORM devuelve un objeto `DeleteResult`.
    // La propiedad `affected` indica cuántas filas fueron eliminadas.
    if (result.affected === 0) {
      throw new NotFoundException(`Usuario con ID "${id}" no encontrado.`);
    }
  }
}
