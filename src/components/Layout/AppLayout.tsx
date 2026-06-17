import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Calendar,
  Users,
  Settings,
  LogOut,
  ClipboardList,
  MapPin,
  BarChart3,
  Bell,
  RefreshCcw,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { cn, getRoleHomeRoute } from '../../utils';
import type { UserRole } from '../../types';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { path: '/customer', label: '首页', icon: Home, roles: ['customer'] },
  { path: '/customer/order', label: '立即下单', icon: ClipboardList, roles: ['customer'] },
  { path: '/customer/orders', label: '我的订单', icon: Calendar, roles: ['customer'] },
  { path: '/customer/recurring', label: '定期服务', icon: RefreshCcw, roles: ['customer'] },

  { path: '/dispatcher', label: '调度中心', icon: Home, roles: ['dispatcher'] },
  { path: '/dispatcher/orders', label: '订单管理', icon: ClipboardList, roles: ['dispatcher'] },
  { path: '/dispatcher/schedule', label: '排班看板', icon: Calendar, roles: ['dispatcher'] },
  { path: '/dispatcher/bad-reviews', label: '差评处理', icon: Bell, roles: ['dispatcher'] },

  { path: '/cleaner', label: '工作台', icon: Home, roles: ['cleaner'] },
  { path: '/cleaner/orders', label: '我的订单', icon: Calendar, roles: ['cleaner'] },
  { path: '/cleaner/profile', label: '我的档案', icon: Users, roles: ['cleaner'] },

  { path: '/admin', label: '管理首页', icon: Home, roles: ['admin'] },
  { path: '/admin/cleaners', label: '保洁员管理', icon: Users, roles: ['admin'] },
  { path: '/admin/statistics', label: '绩效统计', icon: BarChart3, roles: ['admin'] },
];

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  const roleNavItems = navItems.filter((item) => item.roles.includes(user.role));
  const homeRoute = getRoleHomeRoute(user.role);

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <aside className="w-64 bg-white border-r border-neutral-200 fixed h-full z-30">
        <div className="p-6 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-neutral-800">洁家管家</h1>
              <p className="text-xs text-neutral-500">家政服务管理平台</p>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="bg-primary-50 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <p className="font-medium text-neutral-800">{user.name}</p>
                <p className="text-xs text-primary-600">
                  {user.role === 'customer' && '客户'}
                  {user.role === 'dispatcher' && '调度员'}
                  {user.role === 'cleaner' && '保洁员'}
                  {user.role === 'admin' && '管理员'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <nav className="px-3">
          <p className="text-xs font-medium text-neutral-400 px-3 mb-2 uppercase">导航菜单</p>
          {roleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path !== homeRoute && location.pathname.startsWith(item.path));

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-1 transition-all duration-200',
                  isActive
                    ? 'bg-primary-500 text-white shadow-md shadow-primary-200'
                    : 'text-neutral-600 hover:bg-neutral-100'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-neutral-600 hover:bg-danger-50 hover:text-danger-600 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">退出登录</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64">
        <header className="bg-white border-b border-neutral-200 px-8 py-4 sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-neutral-800">
                {roleNavItems.find((item) => item.path === location.pathname)?.label ||
                  roleNavItems.find((item) => location.pathname.startsWith(item.path))?.label ||
                  '首页'}
              </h2>
              <p className="text-sm text-neutral-500">
                {new Date().toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long',
                })}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 rounded-xl hover:bg-neutral-100 transition-colors">
                <Bell className="w-5 h-5 text-neutral-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

function Sparkles({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    </svg>
  );
}
