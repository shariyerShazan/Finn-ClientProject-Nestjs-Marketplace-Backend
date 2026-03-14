/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser'; // Fixed import
import * as express from 'express';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path'; // <--- এইটা মাস্ট লাগবে

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  // ১. স্ট্যাটিক ফাইল কনফিগারেশন
  app.useStaticAssets(join(process.cwd(), 'public'));

  // ২. বডি পার্সার লজিক (Stripe Webhook এর জন্য)
  app.use(
    express.json({
      limit: '50mb',
      verify: (req: any, res, buf) => {
        // আপনার ইউআরএল যদি '/webhooks/stripe' হয় তবেই rawBody সেট হবে
        if (req.originalUrl === '/webhooks/stripe') {
          req.rawBody = buf;
        }
      },
    }),
  );

  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      stopAtFirstError: true,
      whitelist: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://zen-buy.com', // আপনার ফ্রন্টএন্ড ডোমেইন
      'https://finn-frontend-flame.vercel.app',
    ],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Accept,Authorization',
  });

  // ৪. Swagger
  const config = new DocumentBuilder()
    .setTitle('ByBench Marketplace API')
    .setDescription('The ByBench API description')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth('accessToken')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 3000;
  // VPS এ রান করার জন্য '0.0.0.0' থাকা ভালো
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Server is running on: http://localhost:${port}/docs`);
}

// ৫. এরর হ্যান্ডলিং সহ বুটস্ট্র্যাপ রান করা
bootstrap().catch((err) => {
  console.error('💥 Error during bootstrap:', err);
});

// নিচের এই ভুল 'join' ফাংশনটি ডিলিট করে দিন:
// function join(...) { throw new Error(...) }
