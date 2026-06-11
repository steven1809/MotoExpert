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
      'http://127.0.0.1:3003',
      'https://motoexpert.proyectoscampus.top',
      'http://motoexpert.proyectoscampus.top',
      /\.ngrok-free\.app$/,   // cualquier subdominio ngrok .app
      /\.ngrok-free\.dev$/,   // cualquier subdominio ngrok .dev
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'ngrok-skip-browser-warning',  // ← esto resuelve el error
    ],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port, '0.0.0.0');
}
void bootstrap();