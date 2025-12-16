import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import type { Request } from 'express';
import { BirthsService } from './births.service';
import { CreateBirthDto } from './dto/create-birth.dto';
import { UpdateBirthDto } from './dto/update-birth.dto';
import { JwtAuthGuard } from '../auth/guard/jwt/jwt.guard';
import { User } from '../users/entities/user.entity';

@Controller('births')
@UseGuards(JwtAuthGuard)
export class BirthsController {
  constructor(private readonly birthsService: BirthsService) {}

  @Post()
  create(
    @Body(new ValidationPipe()) createDto: CreateBirthDto,
    @Req() req: Request,
  ) {
    return this.birthsService.create(createDto, req.user as User);
  }

  @Get('animal/:animalId')
  findAll(@Param('animalId') animalId: string, @Req() req: Request) {
    return this.birthsService.findAll(animalId, (req.user as User).id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.birthsService.findOne(id, (req.user as User).id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateBirthDto,
    @Req() req: Request,
  ) {
    return this.birthsService.update(id, updateDto, (req.user as User).id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.birthsService.remove(id, (req.user as User).id);
  }
}

