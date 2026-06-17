export type UserRole = 'customer' | 'dispatcher' | 'cleaner' | 'admin';

export type ServiceType = 'daily' | 'deep' | 'moving';

export type OrderStatus =
  | 'pending'
  | 'assigned'
  | 'accepted'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'paid'
  | 'reviewed'
  | 'cancelled';

export type CleanerStatus = 'available' | 'busy' | 'offline' | 'on_leave' | 'rest';

export type RecurringFrequency = 'weekly' | 'biweekly' | 'monthly';

export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface Address {
  id: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  houseArea: number;
  location: GeoLocation;
}

export interface User {
  id: string;
  role: UserRole;
  name: string;
  phone: string;
  avatar?: string;
  createdAt: string;
}

export interface Customer extends User {
  role: 'customer';
  addresses: Address[];
}

export interface Cleaner extends User {
  role: 'cleaner';
  skills: ServiceType[];
  rating: number;
  totalOrders: number;
  location: GeoLocation;
  status: CleanerStatus;
  serviceArea?: string;
  serviceYears?: number;
}

export interface Dispatcher extends User {
  role: 'dispatcher';
}

export interface Admin extends User {
  role: 'admin';
}

export interface OrderPhoto {
  id: string;
  type: 'before' | 'after';
  url: string;
  uploadedAt: string;
}

export interface Review {
  id: string;
  orderId: string;
  rating: number;
  content: string;
  createdAt: string;
  isBadReview: boolean;
  handled?: boolean;
  handlerNote?: string;
  handlerId?: string;
}

export interface Order {
  id: string;
  orderNo: string;
  customerId: string;
  customer: Customer;
  cleanerId?: string;
  cleaner?: Cleaner;
  dispatcherId?: string;
  serviceType: ServiceType;
  address: Address;
  houseArea: number;
  scheduledTime: string;
  actualCheckInTime?: string;
  actualCompleteTime?: string;
  price: number;
  status: OrderStatus;
  photos: OrderPhoto[];
  review?: Review;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringService {
  id: string;
  customerId: string;
  serviceType: ServiceType;
  address: Address;
  addressId?: string;
  houseArea: number;
  frequency: RecurringFrequency;
  preferredTime: string;
  preferredDay?: number;
  preferredCleanerId?: string;
  startDate: string;
  nextOrderDate: string;
  completedOrders?: number;
  nextOrders?: Order[];
  isActive: boolean;
  createdAt: string;
}

export interface DispatchRecommendation {
  cleanerId: string;
  cleaner: Cleaner;
  distance: number;
  skillMatch: boolean;
  ratingScore: number;
  overallScore: number;
}

export interface CleanerPerformance {
  cleanerId: string;
  cleaner: Cleaner;
  month: string;
  totalOrders: number;
  avgRating: number;
  badReviewCount: number;
  onTimeRate: number;
  baseCommission: number;
  bonusCommission: number;
  totalCommission: number;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface CreateOrderRequest {
  serviceType: ServiceType;
  addressId: string;
  houseArea: number;
  scheduledTime: string;
}

export interface DispatchOrderRequest {
  orderId: string;
  cleanerId: string;
}

export interface SubmitReviewRequest {
  orderId: string;
  rating: number;
  content: string;
}

export const SERVICE_CONFIG: Record<ServiceType, { name: string; basePrice: number; unit: string; icon: string }> = {
  daily: { name: '日常保洁', basePrice: 50, unit: '元/小时', icon: 'Sparkles' },
  deep: { name: '深度清洁', basePrice: 80, unit: '元/小时', icon: 'Droplets' },
  moving: { name: '搬家打扫', basePrice: 120, unit: '元/小时', icon: 'Truck' },
};

export const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: '待派单', color: 'text-amber-600', bgColor: 'bg-amber-50' },
  assigned: { label: '已派单', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  accepted: { label: '已接单', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  checked_in: { label: '已签到', color: 'text-purple-600', bgColor: 'bg-purple-50' },
  in_progress: { label: '服务中', color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  completed: { label: '已完成', color: 'text-green-600', bgColor: 'bg-green-50' },
  paid: { label: '已支付', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  reviewed: { label: '已评价', color: 'text-teal-600', bgColor: 'bg-teal-50' },
  cancelled: { label: '已取消', color: 'text-gray-600', bgColor: 'bg-gray-50' },
};

export const RECURRING_FREQUENCY_CONFIG: Record<RecurringFrequency, { label: string; days: number }> = {
  weekly: { label: '每周1次', days: 7 },
  biweekly: { label: '每2周1次', days: 14 },
  monthly: { label: '每月1次', days: 30 },
};
