import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    // 기본 에러 정보 세팅
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '알 수 없는 오류';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      // HttpException 응답이 string, object 모두 가능
      if (typeof response === 'string') {
        message = response;
      } else if (typeof response === 'object' && response !== null) {
        // NestJS 9 이상: response['message']가 배열인 경우도 있음
        message = (response as any).message ?? message;
        // statusCode도 response 객체에서 우선 추출
        status = (response as any).statusCode ?? status;
      }
    }

    // 로깅 (외부 노출 X, 내부 관리)
    Logger.error(
      `[${req.method}] ${req.url} - ${status} - ${JSON.stringify(message)} - ${exception instanceof Error ? exception.stack : ''}`,
      '',
      'AllExceptionsFilter',
    );

    // 안전한 응답 객체 구성
    res.status(status)
      .header('Content-Type', 'application/json; charset=utf-8')
      .send({
        success: false,
        message: message,
        data: null,
        error: {
          statusCode: status,
          timestamp: new Date().toISOString(),
          path: req.url,
        },
      });
  }
}
