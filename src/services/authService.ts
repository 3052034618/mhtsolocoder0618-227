import type { ApiResponse, User, UserRole } from '../types';
import { MOCK_LOGIN_CREDENTIALS } from '../mock';
import { delay } from '../utils';

export const login = async (phone: string, role: UserRole): Promise<ApiResponse<User>> => {
  await delay(800);

  const credential = MOCK_LOGIN_CREDENTIALS.find(
    (c) => c.phone === phone && c.role === role
  );

  if (!credential) {
    throw new Error('账号或角色错误，请使用测试账号登录');
  }

  return {
    code: 200,
    message: '登录成功',
    data: credential.user,
  };
};

export const logout = async (): Promise<ApiResponse<null>> => {
  await delay(300);
  return {
    code: 200,
    message: '退出成功',
    data: null,
  };
};
