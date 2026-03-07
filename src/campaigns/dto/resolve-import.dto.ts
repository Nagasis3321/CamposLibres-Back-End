import { IsOptional, IsUUID, IsObject } from 'class-validator';
import { ImportVaccinationDto } from './import-vaccination.dto';

export class ResolveImportDto extends ImportVaccinationDto {
  @IsOptional()
  @IsUUID()
  groupId?: string;

  /** Mapeo ownerNombre (del JSON) -> userId. Si viene, se usa en lugar de buscar por nombre. */
  @IsOptional()
  @IsObject()
  ownerMapping?: Record<string, string>;
}
