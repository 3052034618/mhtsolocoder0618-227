import { SERVICE_CONFIG } from '../types';
import type { GeoLocation, ServiceType, Cleaner, Address } from '../types';

export const cn = (...args: (string | undefined | null | false)[]): string => {
  return args.filter(Boolean).join(' ');
};

export const calculateDistance = (loc1: GeoLocation, loc2: GeoLocation): number => {
  const R = 6371;
  const dLat = ((loc2.lat - loc1.lat) * Math.PI) / 180;
  const dLng = ((loc2.lng - loc1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((loc1.lat * Math.PI) / 180) *
      Math.cos((loc2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

export const calculatePrice = (serviceType: ServiceType, houseArea: number): number => {
  const config = SERVICE_CONFIG[serviceType];
  const baseHours = Math.max(2, Math.ceil(houseArea / 30));
  return config.basePrice * baseHours;
};

export const calculateCommission = (
  price: number,
  rating: number,
  isBadReview: boolean
): { base: number; bonus: number; total: number } => {
  const baseRate = 0.5;
  const base = price * baseRate;

  let bonus = 0;
  if (rating >= 4.9 && !isBadReview) {
    bonus = price * 0.1;
  } else if (rating >= 4.5 && !isBadReview) {
    bonus = price * 0.05;
  }

  let penalty = 0;
  if (isBadReview) {
    penalty = price * 0.1;
  }

  return {
    base,
    bonus,
    total: Math.max(0, base + bonus - penalty),
  };
};

export const generateOrderNo = (): string => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `BJ${dateStr}${random}`;
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

export const recommendCleaners = (
  cleaners: Cleaner[],
  address: Address,
  serviceType: ServiceType
): { cleaner: Cleaner; distance: number; skillMatch: boolean; ratingScore: number; overallScore: number }[] => {
  return cleaners
    .filter((c) => c.status === 'available')
    .map((cleaner) => {
      const distance = calculateDistance(cleaner.location, address.location);
      const skillMatch = cleaner.skills.includes(serviceType);
      const ratingScore = cleaner.rating / 5;
      const distanceScore = Math.max(0, 1 - distance / 10);
      const skillScore = skillMatch ? 1 : 0.3;

      const overallScore = distanceScore * 0.4 + ratingScore * 0.35 + skillScore * 0.25;

      return {
        cleaner,
        distance,
        skillMatch,
        ratingScore,
        overallScore,
      };
    })
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, 3);
};

export const formatDate = (dateStr: string, format: string = 'yyyy-MM-dd HH:mm'): string => {
  const date = new Date(dateStr);
  const pad = (n: number) => n.toString().padStart(2, '0');

  const map: Record<string, string> = {
    yyyy: date.getFullYear().toString(),
    MM: pad(date.getMonth() + 1),
    dd: pad(date.getDate()),
    HH: pad(date.getHours()),
    mm: pad(date.getMinutes()),
    ss: pad(date.getSeconds()),
  };

  return format.replace(/yyyy|MM|dd|HH|mm|ss/g, (match) => map[match]);
};

export const formatRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return formatDate(dateStr, 'yyyy-MM-dd');
};

export const getFullAddress = (address: Address): string => {
  return `${address.province}${address.city}${address.district}${address.detail}`;
};

export const getRoleHomeRoute = (role: string): string => {
  switch (role) {
    case 'customer':
      return '/customer';
    case 'dispatcher':
      return '/dispatcher';
    case 'cleaner':
      return '/cleaner';
    case 'admin':
      return '/admin';
    default:
      return '/';
  }
};

export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const getNextOrderDate = (
  frequency: 'weekly' | 'biweekly' | 'monthly',
  startDate: string = new Date().toISOString().slice(0, 10),
  preferredDay?: number
): string => {
  const base = new Date(startDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  let next = new Date(base);
  next.setHours(0, 0, 0, 0);

  if (preferredDay !== undefined && preferredDay >= 1 && preferredDay <= 7) {
    const dayOfWeek = next.getDay() === 0 ? 7 : next.getDay();
    const diff = ((preferredDay - dayOfWeek) + 7) % 7;
    next.setDate(next.getDate() + diff);
  }

  while (next <= now) {
    switch (frequency) {
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'biweekly':
        next.setDate(next.getDate() + 14);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
    }
    if (preferredDay !== undefined && preferredDay >= 1 && preferredDay <= 7) {
      const dayOfWeek = next.getDay() === 0 ? 7 : next.getDay();
      const diff = ((preferredDay - dayOfWeek) + 7) % 7;
      next.setDate(next.getDate() + diff);
    }
  }

  return next.toISOString().slice(0, 10);
};

export const getFollowingOrderDate = (
  frequency: 'weekly' | 'biweekly' | 'monthly',
  currentDate: string,
  preferredDay?: number
): string => {
  const next = new Date(currentDate);

  switch (frequency) {
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
  }

  if (preferredDay !== undefined && preferredDay >= 1 && preferredDay <= 7) {
    const dayOfWeek = next.getDay() === 0 ? 7 : next.getDay();
    const diff = ((preferredDay - dayOfWeek) + 7) % 7;
    next.setDate(next.getDate() + diff);
  }

  return next.toISOString().slice(0, 10);
};
