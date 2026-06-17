import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { User, Phone, LogIn, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import type { UserRole } from '../types';
import { getRoleHomeRoute, cn } from '../utils';

interface LoginForm {
  phone: string;
  role: UserRole;
}

const roleOptions: { value: UserRole; label: string; icon: string }[] = [
  { value: 'customer', label: '客户', icon: '👤' },
  { value: 'cleaner', label: '保洁员', icon: '🧹' },
  { value: 'dispatcher', label: '调度员', icon: '📋' },
  { value: 'admin', label: '管理员', icon: '⚙️' },
];

const testAccounts: { role: UserRole; phone: string; desc: string }[] = [
  { role: 'customer', phone: '13900139001', desc: '客户 - 陈女士' },
  { role: 'cleaner', phone: '13800138001', desc: '保洁员 - 张阿姨' },
  { role: 'dispatcher', phone: '13700137001', desc: '调度员 - 周调度' },
  { role: 'admin', phone: '13600136001', desc: '管理员' },
];

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginForm>({
    defaultValues: {
      phone: '',
      role: 'customer',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);

    try {
      await login(data.phone, data.role);
      navigate(getRoleHomeRoute(data.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (phone: string, role: UserRole) => {
    setIsLoading(true);
    setError(null);

    try {
      await login(phone, role);
      navigate(getRoleHomeRoute(role));
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-20 h-20 bg-primary-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary-200">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-800 mb-2">洁家管家</h1>
          <p className="text-neutral-500">家政服务管理平台</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-xl font-bold text-neutral-800 mb-6">登录账号</h2>

          {error && (
            <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-xl text-danger-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="label">选择身份</label>
              <div className="grid grid-cols-4 gap-2">
                {roleOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      register('role').onChange({
                        target: { value: option.value },
                      })
                    }
                    className={cn(
                      'p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-1',
                      selectedRole === option.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-neutral-200 hover:border-primary-200 text-neutral-600'
                    )}
                  >
                    <span className="text-2xl">{option.icon}</span>
                    <span className="text-xs font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">手机号</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="tel"
                  placeholder="请输入手机号"
                  className="input-field pl-12"
                  {...register('phone', {
                    required: '请输入手机号',
                    pattern: {
                      value: /^1[3-9]\d{9}$/,
                      message: '请输入正确的手机号',
                    },
                  })}
                />
              </div>
              {errors.phone && (
                <p className="mt-2 text-sm text-danger-600">{errors.phone.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center gap-2 py-4"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  登录
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-neutral-100">
            <p className="text-sm text-neutral-500 mb-3">测试账号（点击快速登录）：</p>
            <div className="space-y-2">
              {testAccounts
                .filter((acc) => acc.role === selectedRole)
                .map((acc) => (
                  <button
                    key={acc.phone}
                    type="button"
                    onClick={() => quickLogin(acc.phone, acc.role)}
                    disabled={isLoading}
                    className="w-full p-3 text-left bg-neutral-50 hover:bg-primary-50 rounded-xl transition-colors flex items-center justify-between group"
                  >
                    <span className="text-sm text-neutral-600 group-hover:text-primary-600">
                      {acc.desc}
                    </span>
                    <span className="text-xs text-neutral-400">{acc.phone}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-neutral-400 mt-6">
          © 2026 洁家管家 · 家政服务管理平台
        </p>
      </div>
    </div>
  );
};
