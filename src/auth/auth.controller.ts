// Archivo: src/auth/auth.controller.ts

import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guard/jwt/jwt.guard';

// Se recomienda definir una interfaz para el objeto `user` en la solicitud
// para mejorar la seguridad de tipos y el autocompletado.
interface RequestWithUser extends Request {
  user: {
    sub: string;
    email: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: Request) {
    return req.user;
  }

  @Post('demo')
  demoLogin() {
    return this.authService.demoLogin();
  }

  // --- NUEVO ENDPOINT PARA BORRAR USUARIO ---
  @Delete('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT) // Es una buena práctica responder 204 No Content en un DELETE exitoso.
  deleteUser(@Req() req: RequestWithUser) {
    // El ID del usuario se extrae de forma segura del payload del token JWT.
    const userId = req.user.sub;
    return this.authService.deleteUser(userId);
  }
}
