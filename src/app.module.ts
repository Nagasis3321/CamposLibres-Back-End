import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AnimalsModule } from './animals/animals.module';
import { GroupsModule } from './groups/groups.module';
import { AuthModule } from './auth/auth.module'; // <-- Solo una vez aquí
import { DatabaseModule } from './database/database.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { AnimalHistoryModule } from './animal-history/animal-history.module';
import { VaccinationsModule } from './vaccinations/vaccinations.module';
import { AnimalStatesModule } from './animal-states/animal-states.module';
import { BirthsModule } from './births/births.module';
import appConfig from './config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    DatabaseModule,
    UsersModule,
    AnimalsModule,
    GroupsModule,
    AuthModule,
    CampaignsModule,
    AnimalHistoryModule,
    VaccinationsModule,
    AnimalStatesModule,
    BirthsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}