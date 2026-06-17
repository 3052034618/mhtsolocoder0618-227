import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Maximize2,
  Phone,
  MessageSquare,
  CheckCircle,
  Camera,
  ChevronLeft,
  User,
  Map,
  Upload,
  AlertTriangle,
  Navigation,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useOrderStore } from '../../store/useOrderStore';
import { useUserStore } from '../../store/useUserStore';
import { OrderTimeline } from '../../components/ui/OrderTimeline';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PhotoCompare } from '../../components/ui/PhotoCompare';
import { SERVICE_CONFIG } from '../../types';
import { formatDate, cn } from '../../utils';

const demoBeforeImage = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=600&fit=crop';
const demoAfterImage = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop';

export const ServiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { orders, fetchOrders, acceptOrder, checkIn, startService, completeService, uploadPhoto, loading } =
    useOrderStore();
  const { customers, fetchCustomers } = useUserStore();
  const [checkedIn, setCheckedIn] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
  }, []);

  const order = orders.find((o) => o.id === id);
  const customer = order ? customers.find((c) => c.id === order.customerId) : undefined;

  const handleAccept = async () => {
    if (!order) return;
    try {
      await acceptOrder(order.id);
    } catch (error) {
      console.error('Accept order failed:', error);
    }
  };

  const handleCheckIn = async () => {
    if (!order) return;
    try {
      await checkIn(order.id);
      setCheckedIn(true);
    } catch (error) {
      console.error('Check in failed:', error);
    }
  };

  const handleStartService = async () => {
    if (!order) return;
    try {
      await startService(order.id);
    } catch (error) {
      console.error('Start service failed:', error);
    }
  };

  const handleUploadBefore = async () => {
    if (!order) return;
    try {
      await uploadPhoto(order.id, 'before', demoBeforeImage);
    } catch (error) {
      console.error('Upload photo failed:', error);
    }
  };

  const handleUploadAfter = async () => {
    if (!order) return;
    try {
      await uploadPhoto(order.id, 'after', demoAfterImage);
    } catch (error) {
      console.error('Upload photo failed:', error);
    }
  };

  const handleComplete = async () => {
    if (!order) return;
    try {
      await completeService(order.id);
    } catch (error) {
      console.error('Complete service failed:', error);
    }
  };

  if (!order) {
    return (
      <div className="card text-center py-16">
        <p className="text-neutral-500">订单不存在</p>
        <button onClick={() => navigate('/cleaner/orders')} className="btn-primary mt-4">
          返回订单列表
        </button>
      </div>
    );
  }

  const canAccept = order.status === 'assigned' && order.cleanerId === user?.id;
  const canCheckIn =
    order.status === 'accepted' &&
    order.cleanerId === user?.id &&
    new Date(order.scheduledTime) <= new Date();
  const canUploadBefore = order.status === 'checked_in' && order.cleanerId === user?.id;
  const beforePhoto = order.photos?.find((p) => p.type === 'before');
  const afterPhoto = order.photos?.find((p) => p.type === 'after');
  const canStart =
    order.status === 'checked_in' && beforePhoto && order.cleanerId === user?.id;
  const canUploadAfter = order.status === 'in_progress' && order.cleanerId === user?.id;
  const canComplete =
    order.status === 'in_progress' && afterPhoto && order.cleanerId === user?.id;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/cleaner/orders')}
        className="flex items-center gap-2 text-neutral-600 hover:text-neutral-800 transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
        返回订单列表
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-bold text-neutral-800">
                    {SERVICE_CONFIG[order.serviceType].name}
                  </h2>
                  <StatusBadge status={order.status} />
                </div>
                <p className="text-sm text-neutral-500">订单号：{order.orderNo}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary-600">¥{order.price}</p>
                <p className="text-sm text-neutral-500">预计提成 ¥{Math.floor(order.price * 0.6)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-start gap-3 p-4 bg-neutral-50 rounded-xl">
                <MapPin className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-neutral-500 mb-1">服务地址</p>
                  <p className="font-medium text-neutral-800">{order.address.detail}</p>
                  <p className="text-sm text-neutral-500">{order.houseArea}㎡</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-neutral-50 rounded-xl">
                <Clock className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-neutral-500 mb-1">预约时间</p>
                  <p className="font-medium text-neutral-800">{formatDate(order.scheduledTime)}</p>
                  <p className="text-sm text-neutral-500">预计2-3小时</p>
                </div>
              </div>
            </div>

            <OrderTimeline order={order} />
          </div>

          {order.status === 'accepted' && !canCheckIn && (
            <div className="card bg-amber-50 border-amber-200">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 mb-1">还未到服务时间</p>
                  <p className="text-sm text-amber-700">
                    请在 {formatDate(order.scheduledTime)} 后进行签到
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {canCheckIn && (
              <button
                onClick={handleCheckIn}
                disabled={loading}
                className="w-full card bg-gradient-to-r from-primary-500 to-primary-600 text-white p-6 text-left hover:from-primary-600 hover:to-primary-700 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Map className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">上门打卡签到</h3>
                      <p className="text-primary-100">确认您已到达服务地点</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-primary-100 mb-1">距离</p>
                    <p className="font-bold text-lg">约 {(Math.random() * 5 + 0.5).toFixed(1)} km</p>
                  </div>
                </div>
              </button>
            )}

            {canUploadBefore && (
              <div className="card">
                <h3 className="text-lg font-bold text-neutral-800 mb-4 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-primary-500" />
                  拍摄清洁前照片
                </h3>
                <p className="text-sm text-neutral-500 mb-4">
                  请拍摄房屋整体和重点区域照片，用于完工后对比
                </p>
                {beforePhoto ? (
                  <div className="relative group">
                    <img
                      src={beforePhoto.url}
                      alt="清洁前"
                      className="w-full h-64 object-cover rounded-xl"
                    />
                    <div className="absolute top-4 left-4 px-3 py-1 bg-green-500 text-white rounded-full text-sm font-medium flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      已上传
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleUploadBefore}
                    disabled={loading}
                    className="w-full h-64 border-2 border-dashed border-neutral-300 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-primary-400 hover:bg-primary-50 transition-all group"
                  >
                    <div className="w-16 h-16 rounded-full bg-neutral-100 group-hover:bg-primary-100 flex items-center justify-center transition-colors">
                      <Camera className="w-8 h-8 text-neutral-400 group-hover:text-primary-500" />
                    </div>
                    <p className="text-neutral-500 group-hover:text-primary-600 font-medium">
                      点击拍摄或上传照片
                    </p>
                  </button>
                )}
              </div>
            )}

            {canStart && (
              <button
                onClick={handleStartService}
                disabled={loading}
                className="w-full card bg-gradient-to-r from-accent-500 to-accent-600 text-white p-6 text-left hover:from-accent-600 hover:to-accent-700 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                      <SparklesIcon className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">开始服务</h3>
                      <p className="text-accent-100">照片已上传，开始清洁工作</p>
                    </div>
                  </div>
                </div>
              </button>
            )}

            {canUploadAfter && (
              <div className="card">
                <h3 className="text-lg font-bold text-neutral-800 mb-4 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-primary-500" />
                  拍摄清洁后照片
                </h3>
                <p className="text-sm text-neutral-500 mb-4">
                  请拍摄与清洁前相同角度的照片，便于客户对比
                </p>
                {afterPhoto ? (
                  <div className="relative group">
                    <PhotoCompare
                      beforePhoto={beforePhoto}
                      afterPhoto={afterPhoto}
                    />
                    <div className="absolute top-4 left-4 px-3 py-1 bg-green-500 text-white rounded-full text-sm font-medium flex items-center gap-1 z-10">
                      <CheckCircle className="w-4 h-4" />
                      已上传
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleUploadAfter}
                    disabled={loading}
                    className="w-full h-64 border-2 border-dashed border-neutral-300 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-primary-400 hover:bg-primary-50 transition-all group"
                  >
                    <div className="w-16 h-16 rounded-full bg-neutral-100 group-hover:bg-primary-100 flex items-center justify-center transition-colors">
                      <Upload className="w-8 h-8 text-neutral-400 group-hover:text-primary-500" />
                    </div>
                    <p className="text-neutral-500 group-hover:text-primary-600 font-medium">
                      点击上传完工照片
                    </p>
                  </button>
                )}
              </div>
            )}

            {canComplete && (
              <button
                onClick={handleComplete}
                disabled={loading}
                className="w-full card bg-gradient-to-r from-green-500 to-green-600 text-white p-6 text-left hover:from-green-600 hover:to-green-700 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                      <CheckCircle className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">完成服务</h3>
                      <p className="text-green-100">确认清洁工作已完成</p>
                    </div>
                  </div>
                </div>
              </button>
            )}

            {canAccept && (
              <div className="flex gap-4">
                <button
                  onClick={handleAccept}
                  disabled={loading}
                  className="flex-1 btn-primary py-4 text-lg"
                >
                  确认接单
                </button>
                <button className="flex-1 btn-secondary py-4 text-lg">拒单</button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {customer && (
            <div className="card">
              <h3 className="text-lg font-bold text-neutral-800 mb-4">客户信息</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                  {customer.avatar ? (
                    <img
                      src={customer.avatar}
                      alt={customer.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-primary-600" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-neutral-800">{customer.name}</h4>
                  <p className="text-sm text-neutral-500">{customer.phone}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 rounded-xl text-neutral-700 font-medium transition-colors flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4" />
                  联系
                </button>
                <button className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 rounded-xl text-neutral-700 font-medium transition-colors flex items-center justify-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  消息
                </button>
              </div>
            </div>
          )}

          <div className="card">
            <h3 className="text-lg font-bold text-neutral-800 mb-4">服务导航</h3>
            <div className="bg-neutral-50 rounded-xl h-48 flex items-center justify-center mb-4 overflow-hidden">
              <div className="text-center">
                <Map className="w-12 h-12 text-neutral-300 mx-auto mb-2" />
                <p className="text-sm text-neutral-500">{order.address.detail}</p>
              </div>
            </div>
            <button className="w-full py-3 bg-neutral-900 text-white font-medium rounded-xl hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2">
              <Navigation className="w-5 h-5" />
              导航到服务地址
            </button>
          </div>

          <div className="card bg-blue-50 border-blue-100">
            <h3 className="text-lg font-bold text-blue-800 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              服务注意事项
            </h3>
            <ul className="space-y-2 text-sm text-blue-700">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                请准时到达服务地点，如有特殊情况提前联系客户
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                主动询问客户重点清洁区域和特殊需求
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                清洁前后务必拍摄照片留存
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                完工后请客户检查确认，如有问题及时整改
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    </svg>
  );
}
