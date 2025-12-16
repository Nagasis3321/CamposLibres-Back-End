import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsUUID,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { StateType } from '../entities/animal-state.entity';

export class CreateAnimalStateDto {
  @IsUUID()
  @IsNotEmpty()
  animalId: string;

  @IsEnum(StateType)
  @IsNotEmpty()
  tipo: StateType;

  @IsString()
  @IsOptional()
  nombre?: string;

  @IsDateString()
  @IsNotEmpty()
  fechaInicio: string;

  @IsDateString()
  @IsOptional()
  fechaFin?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

