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
  Query,
} from '@nestjs/common';
import type { Request } from 'express';
import { AnimalsService } from './animals.service';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';
import { JwtAuthGuard } from '../auth/guard/jwt/jwt.guard';
import { User } from '../users/entities/user.entity';
import { UpdateAnimalRelationsDto } from './dto/update-animal-relations.dto'
import { PaginationQueryDto } from './dto/query-animal.dto';

@Controller('animals')
@UseGuards(JwtAuthGuard)
export class AnimalsController {
  constructor(private readonly animalsService: AnimalsService) {}

  @Post()
  create(@Body() createAnimalDto: CreateAnimalDto, @Req() req: Request) {
    return this.animalsService.create(createAnimalDto, req.user as User);
  }

  @Get()
  findAllForUser(@Req() req: Request, @Query() paginationDto: PaginationQueryDto) {
    return this.animalsService.findAllForUser(
      req.user as User,
      paginationDto,
    );
  }

  // --- ENDPOINT PARA ANIMALES DE UN GRUPO ---
  @Get('by-group/:groupId')
  findAllForGroup(
    @Req() req: Request,
    @Param('groupId') groupId: string,
    @Query() paginationDto: PaginationQueryDto,
  ) {
    return this.animalsService.findAllForGroup(
      req.user as User,
      groupId,
      paginationDto,
    );
  }

  // Rutas específicas deben ir antes de rutas genéricas con parámetros
  @Get(':id/relations')
  getFamilyRelations(@Param('id') animalId: string, @Req() req: Request) {
    return this.animalsService.getFamilyRelations(
      animalId,
      (req.user as User).id,
    );
  }

  @Patch(':id/relations')
  updateRelations(
    @Param('id') childId: string,
    @Body() relationsDto: UpdateAnimalRelationsDto,
    @Req() req: Request,
  ) {
    return this.animalsService.updateRelations(
      childId,
      relationsDto,
      (req.user as User).id,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.animalsService.findOne(id, (req.user as User).id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAnimalDto: UpdateAnimalDto,
    @Req() req: Request,
  ) {
    return this.animalsService.update(id, updateAnimalDto, (req.user as User).id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.animalsService.remove(id, (req.user as User).id);
  }
}
