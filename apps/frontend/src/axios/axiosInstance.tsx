import axios, { AxiosError } from 'axios';
import type { AxiosResponse } from 'axios';
import { showToast } from '../utils/notifyStore';
import type { ApiRequestOptions, ApiResponse, ApiError } from '../interface/AxiosInterface';

// env 인식 못함 npm 설치 필요~ 산책 다녀와서 할 것 !!
const axiosInstance = axios.create({
  baseURL: import.meta.env.API_URL || 'http://localhost:3000',
  timeout: 8000,
});

// ✅ 요청 인터셉터 (토큰 등 공통 설정)
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) config.headers['Authorization'] = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ 응답 인터셉터 (전역 알림, 에러 핸들링)
axiosInstance.interceptors.response.use(
  (res: AxiosResponse) => {
    const { message, type } = res.data || {};

    console.log('응답 데이터:', res);

    // 성공 메시지 있으면 토스트로!
    if (message) showToast(message, type || 'success');
    return res.data;
  },
  (err: AxiosError<any>) => {
    
    const apiError: ApiError = {
      success: false,
      message: err.response?.data?.message || err.message || '알 수 없는 오류',
      statusCode: err.response?.status,
      ...(err.response?.data || {}),
    };

    showToast(apiError.message, 'error');
    // 401(토큰만료) 등 특수 처리 가능
    if (apiError?.statusCode === 401) localStorage.removeItem('accessToken');

    const customError = apiError as ApiError; // 타입 단일화(실패도 ApiResponse)
    return Promise.reject(customError);
  }
);

export async function apiRequest<T = any>(options: ApiRequestOptions): Promise<ApiResponse<T>> {
  const { url, method, data, params, headers, timeout } = options;
  try {
    const response = await axiosInstance.request<ApiResponse<T>>({
      url,
      method: method.toLowerCase() as any,
      data,
      params,
      headers,
      timeout,
    });
    return response.data;
  } catch (error) {    
    throw error; // 그대로 throw (또는 필요시 추가 가공)
  }
}
