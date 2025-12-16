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
import { AnimalStatesService } from './animal-states.service';
import { CreateAnimalStateDto } from './dto/create-animal-state.dto';
import { UpdateAnimalStateDto } from './dto/update-animal-state.dto';
import { JwtAuthGuard } from '../auth/guard/jwt/jwt.guard';
import { User } from '../users/entities/user.entity';

@Controller('animal-states')
@UseGuards(JwtAuthGuard)
export class AnimalStatesController {
  constructor(private readonly statesService: AnimalStatesService) {}

  @Post()
  create(
    @Body(new ValidationPipe()) createDto: CreateAnimalStateDto,
    @Req() req: Request,
  ) {
    return this.statesService.create(createDto, req.user as User);
  }

  @Get('animal/:animalId')
  findAll(@Param('animalId') animalId: string, @Req() req: Request) {
    return this.statesService.findAll(animalId, (req.user as User).id);
  }

  @Get('animal/:animalId/active')
  findActive(@Param('animalId') animalId: string, @Req() req: Request) {
    return this.statesService.findActive(animalId, (req.user as User).id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.statesService.findOne(id, (req.user as User).id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAnimalStateDto,
    @Req() req: Request,
  ) {
    return this.statesService.update(id, updateDto, (req.user as User).id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.statesService.remove(id, (req.user as User).id);
  }
}

