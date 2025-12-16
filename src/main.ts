import 'crypto';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { TypeOrmExceptionFilter } from './shared/filters/typeorm-exception.filter';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  // Render usará la variable de entorno PORT; si no existe, usará 3000
  const port = process.env.PORT || 3000;
  // Escuchar en '0.0.0.0' es crucial para que Docker exponga el puerto correctamente
  await app.listen(port, '0.0.0.0');
  
  console.log(`La aplicación está corriendo en: ${await app.getUrl()}`);
}
bootstrap();
