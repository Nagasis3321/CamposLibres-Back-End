import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsUUID,
  IsDateString,
} from 'class-validator';

export class CreateAnimalDto {
  @IsString()
  @IsOptional()
  caravana?: string;

  @IsEnum(['Vaca', 'Vaquilla', 'Ternero','Ternera', 'Novillo', 'Toro'])
  @IsNotEmpty()
  tipoAnimal: string;

  @IsString()
  @IsNotEmpty()
  pelaje: string;

  @IsEnum(['Hembra', 'Macho'])
  @IsNotEmpty()
  sexo: string;

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

  @IsUUID()
  @IsOptional()
  duenoId?: string;
}
