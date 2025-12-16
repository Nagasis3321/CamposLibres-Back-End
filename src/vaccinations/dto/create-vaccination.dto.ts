import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsDateString,
} from 'class-validator';

export class CreateVaccinationDto {
  @IsUUID()
  @IsNotEmpty()
  animalId: string;

  @IsString()
  @IsNotEmpty()
  nombreVacuna: string;

  @IsDateString()
  @IsNotEmpty()
  fecha: string;

  @IsString()
  @IsOptional()
  lote?: string;

  @IsString()
  @IsOptional()
  veterinario?: string;

  @IsString()
  @IsOptional()
  observaciones?: string;
}

