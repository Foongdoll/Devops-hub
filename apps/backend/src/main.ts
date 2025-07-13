import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './common/Log/logger.config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonConfig),
  });  

  app.use(helmet());
  app.enableCors({
    origin: [
      'http://13.124.87.223',     // 배포 주소
      'http://localhost:5173',    // 개발 주소
      'file://',                   // Electron 파일 프로토콜
      'app://',                    // Electron 앱 프로토콜
      /^capacitor:\/\/localhost/, // Capacitor (모바일)
      /^ionic:\/\/localhost/,     // Ionic
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.useGlobalFilters(new AllExceptionsFilter);
  await swagger(app);
  await app.listen(process.env.PORT ?? 3000);
}

async function swagger(app) {
  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle(process.env.SWAGGER_TITLE || 'DevOps Hub API')
    .setDescription(process.env.SWAGGER_DESCRIPTION || 'DevOps Hub API 문서입니다.')
    .setVersion(process.env.SWAGGER_VERSION || '1.0')
    .addBearerAuth() // JWT 인증
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document); // http://localhost:3000/api-docs
}

bootstrap();
