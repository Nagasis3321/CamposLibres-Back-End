import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateGroupDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  nombre?: string;
}
