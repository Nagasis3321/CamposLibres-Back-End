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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}