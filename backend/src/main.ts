import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const frontendUrl = configService.get<string>('FRONTEND_URL') || 'http://localhost:3002';

  app.enableCors({
    origin: [
      frontendUrl, 
      'http://localhost:3000', 
      'http://localhost:3001', 
      'http://localhost:3002', 
      'http://localhost:3003',
      'http://127.0.0.1:3002',
      'http://127.0.0.1:3003'
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  const port = configService.get<number>('PORT') || 3001;
<<<<<<< HEAD
  await app.listen(port);
=======
  await app.listen(3000, '0.0.0.0');
>>>>>>> 904ae239af2591971bbcf43441af60c6ca0ebd3e
}
void bootstrap();