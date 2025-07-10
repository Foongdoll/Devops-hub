// src/services/AuthService.ts
import { apiRequest } from "../axios/axiosInstance";

export const login = async (userId: string, userPw: string) => {
  return await apiRequest({
    url: '/auth/login',
    method: 'POST',
    data: { userId, userPw }
  });
};

export const join = async (userId: string, userPw: string, userName: string) => {
  return await apiRequest({
    url: '/auth/join',
    method: 'POST',
    data: { userId, userPw, userName }
  });
};

export const refreshToken = async (refreshToken: string) => {
  return await apiRequest({
    url: '/auth/refresh',
    method: 'POST',
    data: { refreshToken }
  });
};
