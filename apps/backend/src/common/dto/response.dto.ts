import { ApiProperty } from "@nestjs/swagger";

export class ApiResponse<T = any> {
  @ApiProperty({ description: '요청 성공 여부', example: true })
  success: boolean;
  @ApiProperty({ description: '응답 메시지', example: '요청이 성공적으로 처리되었습니다.' })
  message?: string;
  @ApiProperty({ description: '응답 데이터', example: '필요한 Data'})
  data?: T;
  @ApiProperty({ description: 'HTTP 상태 코드', example: 200 })
  statusCode?: number;
  
  [key: string]: any; // 동적으로 다른 속성도 추가 가능

  constructor(partial: Partial<ApiResponse<T>>) {
    Object.assign(this, partial);
  }

  static success<T>(data?: T, message?: string, extra?: Record<string, any>): ApiResponse<T> {
    return new ApiResponse({
      success: true,
      data,
      message,
      ...(extra || {}),
    });
  }

  static error(message: string, extra?: Record<string, any>): ApiResponse<null> {
    return new ApiResponse({
      success: false,
      message,
      ...(extra || {}),
    });
  }
}
