// Archivo: src/auth/auth.service.ts

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
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

    if (!demoUser) {
      const demoPassword = Math.random().toString(36).slice(-12);
      demoUser = await this.usersService.create({
        nombre: 'Usuario Demo',
        email: demoEmail,
        password: demoPassword,
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userProfile } = demoUser;
    const payload = { sub: demoUser.id, email: demoUser.email };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken, user: userProfile };
  }

  // --- NUEVO MÉTODO PARA BORRAR USUARIO ---
  async deleteUser(id: string): Promise<void> {
    // Delega la lógica de borrado al servicio de usuarios.
    await this.usersService.remove(id);
  }
}
