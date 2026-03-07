import 'crypto';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { TypeOrmExceptionFilter } from './shared/filters/typeorm-exception.filter';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.use(helmet());
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new TypeOrmExceptionFilter());

  const port = process.env.PORT || 3000;
  const server = await app.listen(port, '0.0.0.0');

  // Conexiones inestables: timeout alto para evitar cortes en operaciones lentas
  server.setTimeout(60000); // 60 segundos
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;

  console.log(`La aplicación está corriendo en: ${await app.getUrl()}/api`);
}
bootstrap();
