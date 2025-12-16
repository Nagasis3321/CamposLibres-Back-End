import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnimalHistoryService } from './animal-history.service';
import { AnimalHistoryController } from './animal-history.controller';
import { AnimalHistory } from './entities/animal-history.entity';
import { Animal } from '../animals/entities/animal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AnimalHistory, Animal])],
  controllers: [AnimalHistoryController],
  providers: [AnimalHistoryService],
  exports: [AnimalHistoryService],
})
export class AnimalHistoryModule {}

