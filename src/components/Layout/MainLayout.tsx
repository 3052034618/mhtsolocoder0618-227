import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Calendar,
  FileText,
  Repeat,
  LayoutDashboard,
  Users,
  AlertTriangle,
  ClipboardList,
  User,
  BarChart3,
  LogOut,
  Menu,
  X,
  Bell,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { cn, getRoleHomeRoute } from '../../utils';

interface MainLayoutProps {
  children: ReactNode;
}

const navItems = {
  customer: [
    { path: '/customer', label: '首页', icon: Home },
    { path: '/customer/order', label: '立即下单', icon: ClipboardList },
    { path: '/customer/orders', label: '我的订单', icon: FileText },
    { path: '/customer/recurring', label: '定期服务', icon: Repeat },
  ],
  dispatcher: [
    { path: '/dispatcher', label: '调度中心', icon: LayoutDashboard },
    { path: '/dispatcher/orders', label: '订单管理', icon: ClipboardList },
    { path: '/dispatcher/schedule', label: '排班看板', icon: Calendar },
    { path: '/dispatcher/reviews', label: '差评处理', icon: AlertTriangle },
  ],
  cleaner: [
    { path: '/cleaner', label: '工作台', icon: Home },
    { path: '/cleaner/orders', label: '我的订单', icon: FileText },
    { path: '/cleaner/profile', label: '我的档案', icon: User },
  ],
  admin: [
    { path: '/admin', label: '管理首页', icon: BarChart3 },
    { path: '/admin/cleaners', label: '保洁员管理', icon: Users },
    { path: '/admin/statistics', label: '绩效统计', icon: BarChart3 },
  ],
};

export default function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const roleNav = navItems[user.role as keyof typeof navItems] || [];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'customer':
        return '客户';
      case 'dispatcher':
        return '调度员';
      case 'cleaner':
        return '保洁员';
      case 'admin':
        return '管理员';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 bg-white border-r border-neutral-200 transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-20',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
              洁
            </div>
            {sidebarOpen && (
              <span className="font-bold text-lg text-neutral-800">洁家管家</span>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:block p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-neutral-500" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {sidebarOpen && (
          <div className="p-4 border-b border-neutral-100">
            <div className="bg-primary-50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-neutral-800">{user.name}</p>
                  <p className="text-xs text-primary-600">{getRoleLabel(user.role)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <nav className="p-4 space-y-1">
          {sidebarOpen && (
            <p className="text-xs font-medium text-neutral-400 px-3 mb-2 uppercase">导航菜单</p>
          )}
          {roleNav.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path !== getRoleHomeRoute(user.role) &&
                location.pathname.startsWith(item.path));

            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setMobileMenuOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-primary-500 text-white shadow-md shadow-primary-200'
                    : 'text-neutral-600 hover:bg-neutral-100',
                  !sidebarOpen && 'justify-center'
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-100">
          <button
            onClick={handleLogout}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-600 hover:bg-danger-50 hover:text-danger-600 transition-all duration-200',
              !sidebarOpen && 'justify-center'
            )}
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">退出登录</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 min-h-screen">
        <header className="bg-white border-b border-neutral-200 px-6 py-4 sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5 text-neutral-500" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-neutral-800">
                  {roleNav.find((item) => item.path === location.pathname)?.label ||
                    roleNav.find((item) => location.pathname.startsWith(item.path))?.label ||
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
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 rounded-xl hover:bg-neutral-100 transition-colors">
                <Bell className="w-5 h-5 text-neutral-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        <div className="p-6">{children}</div>
      </main>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
