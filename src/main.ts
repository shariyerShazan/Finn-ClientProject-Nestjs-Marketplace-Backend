/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import * as express from 'express';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.use(
    express.json({
      verify: (req: any, res, buf) => {
        if (req.originalUrl.includes('/webhooks/stripe')) {
          req.rawBody = buf;
        }
      },
    }),
  );
  const config = new DocumentBuilder()
    .setTitle('ByBench Marketplace API')
    .setDescription('The ByBench API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'https://finn-frontend-flame.vercel.app',
      'http://localhost:5175',
    ],
    credentials: true,
  });
  app.use(cookieParser());

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Server is running on: http://localhost:${port}/docs`);
}
bootstrap();
