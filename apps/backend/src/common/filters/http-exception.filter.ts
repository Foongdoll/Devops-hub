import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse } from '../dto/response.dto';
import { createLogger } from '../Log/logger.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? String(exception.getResponse())
        : 'Internal server error';

    Logger.log(createLogger({
      message: '예외 발생 - ' + status + ' ' + message + ' - ' + (exception instanceof Error ? exception.stack : ''),
      level: 'error',
      path: req.url,
      timestamp: new Date(),
    }));

    res.status(status).send(
      ApiResponse.error(
        message,
        {
          statusCode: status,
          timestamp: new Date().toISOString(),
          path: req.url
        }
      )
    )
  }
}
