import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsUUID,
  IsDateString,
} from 'class-validator';

export class CreateBirthDto {
  @IsUUID()
  @IsNotEmpty()
  madreId: string;

  @IsUUID()
  @IsOptional()
  criaId?: string;

  @IsDateString()
  @IsNotEmpty()
  fecha: string;

  @IsEnum(['VIVO', 'MUERTO', 'NATIMUERTO'])
  @IsOptional()
  estado?: string;

  @IsString()
  @IsOptional()
  sexoCria?: string;

  @IsString()
  @IsOptional()
  peso?: string;

  @IsString()
  @IsOptional()
  observaciones?: string;
}

