import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { HistoryType } from '../entities/animal-history.entity';

export class CreateAnimalHistoryDto {
  @IsUUID()
  @IsNotEmpty()
  animalId: string;

  @IsEnum(HistoryType)
  @IsNotEmpty()
  tipo: HistoryType;

  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsDateString()
  @IsNotEmpty()
  fecha: string;
}

