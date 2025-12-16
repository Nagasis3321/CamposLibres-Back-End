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
import { VaccinationsService } from './vaccinations.service';
import { CreateVaccinationDto } from './dto/create-vaccination.dto';
import { UpdateVaccinationDto } from './dto/update-vaccination.dto';
import { JwtAuthGuard } from '../auth/guard/jwt/jwt.guard';
import { User } from '../users/entities/user.entity';

@Controller('vaccinations')
@UseGuards(JwtAuthGuard)
export class VaccinationsController {
  constructor(private readonly vaccinationsService: VaccinationsService) {}

  @Post()
  create(
    @Body(new ValidationPipe()) createDto: CreateVaccinationDto,
    @Req() req: Request,
  ) {
    return this.vaccinationsService.create(createDto, req.user as User);
  }

  @Get('animal/:animalId')
  findAll(@Param('animalId') animalId: string, @Req() req: Request) {
    return this.vaccinationsService.findAll(animalId, (req.user as User).id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.vaccinationsService.findOne(id, (req.user as User).id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateVaccinationDto,
    @Req() req: Request,
  ) {
    return this.vaccinationsService.update(id, updateDto, (req.user as User).id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.vaccinationsService.remove(id, (req.user as User).id);
  }
}

