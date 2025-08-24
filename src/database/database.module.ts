import { Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import appConfig from '../config/app.config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [appConfig.KEY],
      useFactory: (configService: ConfigType<typeof appConfig>) => {
        // En producción, Render provee una DATABASE_URL completa
        if (process.env.DATABASE_URL) {
          return {
            type: 'postgres',
            url: process.env.DATABASE_URL,
            synchronize: true, // ¡Muy importante para producción!
            autoLoadEntities: true,
            ssl: {
              rejectUnauthorized: false, // Requerido para conexiones a Render DB
            },
          };
        }
        // Configuración para desarrollo local
        return {
          type: 'postgres',
          host: configService.database.host,
          port: configService.database.port,
          username: configService.database.username,
          password: configService.database.password,
          database: configService.database.name,
          synchronize: true,
          autoLoadEntities: true,
        };
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
