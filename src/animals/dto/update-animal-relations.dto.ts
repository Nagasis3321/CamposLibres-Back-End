import { IsUUID, IsOptional, ValidateIf } from 'class-validator';

export class UpdateAnimalRelationsDto {
  @IsUUID()
  @ValidateIf((o, v) => v !== null) // Permite que el valor sea un UUID o null
  @IsOptional()
  idMadre?: string | null;

  @IsUUID()
  @ValidateIf((o, v) => v !== null) // Permite que el valor sea un UUID o null
  @IsOptional()
  idPadre?: string | null;
}
