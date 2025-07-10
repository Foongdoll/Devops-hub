// ---- Axios 응답 타입 ----
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  statusCode?: number;
  type?: 'success' | 'error' | 'info' | 'warn';
  [key: string]: any;
}

// ---- Axios 에러 타입 (success: false로 통일) ----
export interface ApiError {
  success: false;
  message: string;
  statusCode?: number;
  type?: 'error' | 'warn' | 'info' | 'success';
  [key: string]: any;
}

// ---- 응답 타입 통일 (Promise 기반) ----
export type ApiResponsePromise<T = any> = Promise<ApiResponse<T>>;
export type ApiErrorPromise = Promise<ApiError>;

// ---- 요청 헤더 타입 ----
export interface RequestHeaders {
  'Content-Type'?: string;
  Authorization?: string;
  [key: string]: string | undefined;
}

// ---- HTTP 메서드 Enum ----
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// ---- Axios 요청 옵션 ----
export interface ApiRequestOptions<T = any> {
  url: string;
  method: HttpMethod;
  data?: T;
  params?: Record<string, any>; // param → params로 통일 (axios와 맞춤)
  headers?: RequestHeaders;
  timeout?: number;
}
