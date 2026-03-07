import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';
import { Campaign } from './entities/campaign.entity';
import { GroupsModule } from '../groups/groups.module';
import { Animal } from '../animals/entities/animal.entity';
import { UsersModule } from '../users/users.module';
import { AnimalsModule } from '../animals/animals.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Campaign, Animal]),
    GroupsModule,
    UsersModule,
    AnimalsModule,
  ],
  controllers: [CampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService],
})
export class CampaignsModule {}
