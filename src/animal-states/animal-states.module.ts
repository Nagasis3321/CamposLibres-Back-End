import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnimalStatesService } from './animal-states.service';
import { AnimalStatesController } from './animal-states.controller';
import { AnimalState } from './entities/animal-state.entity';
import { Animal } from '../animals/entities/animal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AnimalState, Animal])],
  controllers: [AnimalStatesController],
  providers: [AnimalStatesService],
  exports: [AnimalStatesService],
})
export class AnimalStatesModule {}

