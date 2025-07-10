import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './common/Log/logger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule,{
    logger: WinstonModule.createLogger(winstonConfig),
  });
  app.use(helmet());
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: 'Content-Type, Authorization',

  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

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
