import { IsString, IsOptional, IsDateString, IsUUID, IsArray, ArrayMinSize } from 'class-validator';

export class UpdateCampaignDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsDateString()
  @IsOptional()
  fecha?: string;

  @IsString()
  @IsOptional()
  productosUtilizados?: string;

  @IsString()
  @IsOptional()
  observaciones?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  @IsOptional()
  animalesIds?: string[];
}
