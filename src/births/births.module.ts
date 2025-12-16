import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BirthsService } from './births.service';
import { BirthsController } from './births.controller';
import { Birth } from './entities/birth.entity';
import { Animal } from '../animals/entities/animal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Birth, Animal])],
  controllers: [BirthsController],
  providers: [BirthsService],
  exports: [BirthsService],
})
export class BirthsModule {}

