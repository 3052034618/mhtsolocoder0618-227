import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Droplets, Truck, Clock, MapPin, ChevronRight, Plus } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useOrderStore } from '../../store/useOrderStore';
import { StatCard } from '../../components/ui/StatCard';
import { OrderCard } from '../../components/ui/OrderCard';
import { SERVICE_CONFIG } from '../../types';
import { formatDate, cn } from '../../utils';
import type { ServiceType } from '../../types';

const serviceCards: { type: ServiceType; color: string; bgColor: string }[] = [
  { type: 'daily', color: 'text-primary-600', bgColor: 'bg-primary-50' },
  { type: 'deep', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { type: 'moving', color: 'text-accent-600', bgColor: 'bg-accent-50' },
];

const ServiceIcon: React.FC<{ type: ServiceType; className?: string }> = ({ type, className }) => {
  if (type === 'daily') return <Sparkles className={className} />;
  if (type === 'deep') return <Droplets className={className} />;
  return <Truck className={className} />;
};

export const CustomerHome: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { orders, fetchOrders, loading } = useOrderStore();

  useEffect(() => {
    if (user) {
      fetchOrders({ customerId: user.id });
    }
  }, [user?.id]);

  const myOrders = orders.filter((o) => o.customerId === user?.id);
  const pendingOrders = myOrders.filter((o) => !['reviewed', 'cancelled'].includes(o.status));
  const completedOrders = myOrders.filter((o) => o.status === 'reviewed');

  const upcomingOrder = pendingOrders[0];

  const handleQuickOrder = (serviceType: ServiceType) => {
    navigate('/customer/order', { state: { serviceType } });
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="进行中的订单"
          value={pendingOrders.length}
          icon={<Clock className="w-6 h-6" />}
          color="primary"
        />
        <StatCard
          title="已完成订单"
          value={completedOrders.length}
          icon={<CheckIcon className="w-6 h-6" />}
          color="accent"
        />
        <StatCard
          title="累计消费"
          value={`¥${completedOrders.reduce((sum, o) => sum + o.price, 0)}`}
          icon={<WalletIcon className="w-6 h-6" />}
          color="neutral"
        />
      </div>

      {upcomingOrder && (
        <div className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 mb-1">即将到来的服务</p>
              <h3 className="text-2xl font-bold mb-2">
                {SERVICE_CONFIG[upcomingOrder.serviceType].name}
              </h3>
              <div className="flex items-center gap-4 text-primary-100">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatDate(upcomingOrder.scheduledTime)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate max-w-[200px]">
                    {upcomingOrder.address.detail}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate(`/customer/orders/${upcomingOrder.id}`)}
              className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              查看详情
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-neutral-800">选择服务类型</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {serviceCards.map((card) => {
            const config = SERVICE_CONFIG[card.type];
            return (
              <div
                key={card.type}
                onClick={() => handleQuickOrder(card.type)}
                className={cn(
                  'card cursor-pointer group',
                  'hover:translate-y-[-4px] transition-transform duration-300'
                )}
              >
                <div
                  className={cn(
                    'w-16 h-16 rounded-2xl flex items-center justify-center mb-4',
                    card.bgColor,
                    'group-hover:scale-110 transition-transform duration-300'
                  )}
                >
                  <ServiceIcon type={card.type} className={cn('w-8 h-8', card.color)} />
                </div>
                <h3 className="text-lg font-bold text-neutral-800 mb-2">{config.name}</h3>
                <p className="text-sm text-neutral-500 mb-4">
                  {card.type === 'daily' && '日常家居清洁，包括客厅、卧室、厨房、卫生间等'}
                  {card.type === 'deep' && '深度清洁服务，重点区域去污，适合定期大扫除'}
                  {card.type === 'moving' && '搬家前后全屋清洁，开荒保洁，入住更安心'}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary-600">
                    {config.basePrice}
                    <span className="text-sm font-normal text-neutral-500">{config.unit}</span>
                  </span>
                  <button className="flex items-center gap-1 text-primary-600 font-medium">
                    立即预约
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-neutral-800">最近订单</h2>
          <button
            onClick={() => navigate('/customer/orders')}
            className="text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1"
          >
            查看全部
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : myOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myOrders.slice(0, 3).map((order) => (
              <OrderCard key={order.id} order={order} role="customer" />
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-neutral-400" />
            </div>
            <p className="text-neutral-500 mb-4">暂无订单</p>
            <button onClick={() => navigate('/customer/order')} className="btn-primary">
              立即预约服务
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
      />
    </svg>
  );
}
