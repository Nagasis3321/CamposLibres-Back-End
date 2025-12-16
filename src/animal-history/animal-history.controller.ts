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
import { AnimalHistoryService } from './animal-history.service';
import { CreateAnimalHistoryDto } from './dto/create-animal-history.dto';
import { UpdateAnimalHistoryDto } from './dto/update-animal-history.dto';
import { JwtAuthGuard } from '../auth/guard/jwt/jwt.guard';
import { User } from '../users/entities/user.entity';

@Controller('animal-history')
@UseGuards(JwtAuthGuard)
export class AnimalHistoryController {
  constructor(private readonly historyService: AnimalHistoryService) {}

  @Post()
  create(
    @Body(new ValidationPipe()) createDto: CreateAnimalHistoryDto,
    @Req() req: Request,
  ) {
    return this.historyService.create(createDto, req.user as User);
  }

  @Get('animal/:animalId')
  findAll(@Param('animalId') animalId: string, @Req() req: Request) {
    return this.historyService.findAll(animalId, (req.user as User).id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.historyService.findOne(id, (req.user as User).id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAnimalHistoryDto,
    @Req() req: Request,
  ) {
    return this.historyService.update(id, updateDto, (req.user as User).id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.historyService.remove(id, (req.user as User).id);
  }
}

