import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { AnimalsModule } from '../animals/animals.module';
import { GroupsModule } from '../groups/groups.module';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { Animal } from '../animals/entities/animal.entity';
import { Group } from '../groups/entities/group.entity';
import { GroupMember } from '../groups/entities/group-member.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';

@Module({
  imports: [
    UsersModule,
    forwardRef(() => AnimalsModule),
    forwardRef(() => GroupsModule),
    forwardRef(() => CampaignsModule),
    TypeOrmModule.forFeature([Animal, Group, GroupMember, Campaign]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '1d', // El token expirará en 1 día
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [JwtStrategy, PassportModule], // Exportamos para poder usarlo en otros módulos
})
export class AuthModule {}
