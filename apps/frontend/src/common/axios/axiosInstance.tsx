import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { showToast, showAlert } from '../uills/notify'; // 아래에서 정의

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
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
    const { message, status, type } = res.data || {};
    // 성공 메시지 있으면 토스트로!
    if (message) showToast(message, type || 'success');
    return res.data;
  },
  (err: AxiosError<any>) => {
    const res = err.response;
    // 서버에서 에러 메시지 내려주면 그걸, 없으면 기본 메시지
    const message = res?.data?.message || err.message || '알 수 없는 오류';
    showToast(message, 'error');
    // 401(토큰만료) 등 특수 처리 가능
    if (res?.status === 401) localStorage.removeItem('accessToken');
    return Promise.reject(err);
  }
);

export default axiosInstance;