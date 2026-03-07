import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsArray,
  ValidateNested,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RegistroVacunacionItemDto {
  @IsString()
  @IsNotEmpty()
  caravana: string;

  @IsString()
  @IsNotEmpty()
  tipoAnimal: string;

  @IsString()
  @IsOptional()
  pelaje?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  ownerNombre: string;
}

export class ImportVaccinationDto {
  @IsDateString()
  @IsNotEmpty()
  fechaVacunacion: string;

  @IsString()
  @IsOptional()
  nombreCampana?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RegistroVacunacionItemDto)
  registros: RegistroVacunacionItemDto[];
}
