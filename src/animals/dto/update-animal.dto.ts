import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsUUID,
} from 'class-validator';

export class UpdateAnimalDto {
  @IsString()
  @IsOptional()
  caravana?: string;

  @IsEnum(['Vaca', 'Vaquilla', 'Ternero', 'Ternera', 'Novillo', 'Toro'])
  @IsOptional()
  tipoAnimal?: string;

  @IsString()
  @IsOptional()
  pelaje?: string;

  @IsEnum(['Hembra', 'Macho'])
  @IsOptional()
  sexo?: string;

  @IsString()
  @IsOptional()
  raza?: string;

  @IsDateString()
  @IsOptional()
  fechaNacimiento?: string;

  @IsUUID()
  @IsOptional()
  idMadre?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;
}
