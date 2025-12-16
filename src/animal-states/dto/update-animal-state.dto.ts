import { PartialType } from '@nestjs/mapped-types';
import { CreateAnimalStateDto } from './create-animal-state.dto';

export class UpdateAnimalStateDto extends PartialType(CreateAnimalStateDto) {}

