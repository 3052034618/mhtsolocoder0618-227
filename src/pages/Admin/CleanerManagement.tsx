import React, { useEffect, useState } from 'react';
import {
  User,
  Search,
  Filter,
  Plus,
  Star,
  MapPin,
  Phone,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  Calendar,
  Trophy,
} from 'lucide-react';
import { useUserStore } from '../../store/useUserStore';
import { useOrderStore } from '../../store/useOrderStore';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SERVICE_CONFIG } from '../../types';
import { formatDate, cn, calculateCommission } from '../../utils';
import type { Cleaner } from '../../types';

export const CleanerManagement: React.FC = () => {
  const { cleaners, fetchCleaners, updateCleaner, deleteCleaner, loading } = useUserStore();
  const { orders, fetchOrders } = useOrderStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'on_leave' | 'rest'>('all');
  const [selectedCleaner, setSelectedCleaner] = useState<Cleaner | null>(null);

  useEffect(() => {
    fetchCleaners();
    fetchOrders();
  }, []);

  const filteredCleaners = cleaners.filter((cleaner) => {
    const matchesSearch =
      searchQuery === '' ||
      cleaner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cleaner.phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || cleaner.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getCleanerStats = (cleanerId: string) => {
    const cleanerOrders = orders.filter(
      (o) => o.cleanerId === cleanerId && o.status !== 'cancelled'
    );
    const completed = cleanerOrders.filter((o) => o.status === 'reviewed');
    const reviewed = completed.filter((o) => o.review);
    const avgRating =
      reviewed.length > 0
        ? reviewed.reduce((sum, o) => sum + (o.review?.rating || 0), 0) / reviewed.length
        : 0;
    const totalEarnings = completed.reduce((sum, o) => sum + calculateCommission(o.price, o.review?.rating || 5, o.review?.isBadReview || false).total, 0);

    return {
      totalOrders: cleanerOrders.length,
      completedOrders: completed.length,
      avgRating: avgRating.toFixed(1),
      totalEarnings,
    };
  };

  const handleStatusChange = async (cleaner: Cleaner, status: 'available' | 'on_leave' | 'rest') => {
    try {
      await updateCleaner(cleaner.id, { status });
    } catch (error) {
      console.error('Update cleaner status failed:', error);
    }
  };

  const handleDelete = async (cleanerId: string) => {
    if (confirm('确定要删除该保洁员吗？')) {
      try {
        await deleteCleaner(cleanerId);
      } catch (error) {
        console.error('Delete cleaner failed:', error);
      }
    }
  };

  const statusCounts = {
    all: cleaners.length,
    available: cleaners.filter((c) => c.status === 'available').length,
    on_leave: cleaners.filter((c) => c.status === 'on_leave').length,
    rest: cleaners.filter((c) => c.status === 'rest').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-800">保洁员管理</h2>
          <p className="text-neutral-500">管理保洁员信息、状态和技能</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          添加保洁员
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-100 flex items-center justify-center">
              <User className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-neutral-800">{cleaners.length}</p>
              <p className="text-sm text-neutral-500">总人数</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-green-600">{statusCounts.available}</p>
              <p className="text-sm text-neutral-500">在岗</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-600">{statusCounts.on_leave}</p>
              <p className="text-sm text-neutral-500">休假</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-neutral-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-neutral-600">{statusCounts.rest}</p>
              <p className="text-sm text-neutral-500">休息</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="搜索姓名、电话..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-12"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card p-2 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {[
            { value: 'all', label: '全部' },
            { value: 'available', label: '在岗' },
            { value: 'on_leave', label: '休假' },
            { value: 'rest', label: '休息' },
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value as any)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2',
                statusFilter === filter.value
                  ? 'bg-primary-500 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100'
              )}
            >
              {filter.label}
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs',
                  statusFilter === filter.value
                    ? 'bg-white/20 text-white'
                    : 'bg-neutral-100 text-neutral-500'
                )}
              >
                {statusCounts[filter.value as keyof typeof statusCounts]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCleaners.map((cleaner) => {
          const stats = getCleanerStats(cleaner.id);

          return (
            <div key={cleaner.id} className="card group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center overflow-hidden">
                      {cleaner.avatar ? (
                        <img
                          src={cleaner.avatar}
                          alt={cleaner.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 text-primary-600" />
                      )}
                    </div>
                    <div
                      className={cn(
                        'absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white',
                        cleaner.status === 'available'
                          ? 'bg-green-500'
                          : cleaner.status === 'on_leave'
                          ? 'bg-amber-500'
                          : 'bg-neutral-400'
                      )}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-800">{cleaner.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Star className="w-4 h-4 text-accent-500 fill-accent-500" />
                      <span className="font-medium">{stats.avgRating}</span>
                      <span className="text-neutral-400">·</span>
                      <span className="text-sm text-neutral-500">{stats.completedOrders}单</span>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5 text-neutral-400" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {cleaner.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-1 bg-primary-100 text-primary-600 rounded-lg text-xs font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-neutral-600">
                  <Phone className="w-4 h-4 text-neutral-400" />
                  <span>{cleaner.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-600">
                  <MapPin className="w-4 h-4 text-neutral-400" />
                  <span className="truncate">{cleaner.serviceArea}</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-600">
                  <Calendar className="w-4 h-4 text-neutral-400" />
                  <span>入职 {cleaner.serviceYears}年</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-neutral-100">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-neutral-500">累计收入</p>
                    <p className="text-xl font-bold text-primary-600">¥{stats.totalEarnings}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">本月接单</p>
                    <p className="text-xl font-bold text-accent-600">
                      {
                        orders.filter(
                          (o) =>
                            o.cleanerId === cleaner.id &&
                            o.scheduledTime.startsWith(new Date().toISOString().slice(0, 7)) &&
                            o.status !== 'cancelled'
                        ).length
                      }
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={cleaner.status}
                    onChange={(e) => handleStatusChange(cleaner, e.target.value as any)}
                    className="flex-1 input-field py-2 text-sm"
                    disabled={loading}
                  >
                    <option value="available">在岗</option>
                    <option value="on_leave">休假</option>
                    <option value="rest">休息</option>
                  </select>
                  <button className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-xl text-neutral-700 transition-colors">
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(cleaner.id)}
                    className="px-4 py-2 bg-danger-50 hover:bg-danger-100 rounded-xl text-danger-600 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCleaners.length === 0 && (
        <div className="card text-center py-16">
          <User className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500">没有找到符合条件的保洁员</p>
        </div>
      )}
    </div>
  );
};
