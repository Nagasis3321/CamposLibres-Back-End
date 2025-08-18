import { IsString, IsNotEmpty, IsOptional, IsDateString, IsUUID, IsArray, ArrayMinSize } from 'class-validator';

export class CreateCampaignDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsDateString()
  @IsNotEmpty()
  fecha: string;

  @IsString()
  @IsOptional()
  productosUtilizados?: string;

  @IsString()
  @IsOptional()
  observaciones?: string;

  @IsUUID()
  @IsOptional() // Si no se provee, es una campaña individual
  groupId?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  animalesIds: string[];
}
