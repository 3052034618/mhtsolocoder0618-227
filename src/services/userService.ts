import type {
  ApiResponse,
  Cleaner,
  Customer,
  RecurringService,
  CleanerPerformance,
  Address,
} from '../types';
import { MOCK_CLEANERS, MOCK_CUSTOMERS, MOCK_RECURRING_SERVICES } from '../mock';
import { delay, generateId, calculateCommission, getNextOrderDate } from '../utils';

export const getCleaners = async (): Promise<ApiResponse<Cleaner[]>> => {
  await delay(400);
  return {
    code: 200,
    message: '获取成功',
    data: [...MOCK_CLEANERS],
  };
};

export const getCleanerById = async (id: string): Promise<ApiResponse<Cleaner>> => {
  await delay(300);

  const cleaner = MOCK_CLEANERS.find((c) => c.id === id);
  if (!cleaner) {
    throw new Error('保洁员不存在');
  }

  return {
    code: 200,
    message: '获取成功',
    data: cleaner,
  };
};

export const getCustomers = async (): Promise<ApiResponse<Customer[]>> => {
  await delay(400);
  return {
    code: 200,
    message: '获取成功',
    data: [...MOCK_CUSTOMERS],
  };
};

export const getRecurringServices = async (
  customerId?: string
): Promise<ApiResponse<RecurringService[]>> => {
  await delay(400);

  let result = [...MOCK_RECURRING_SERVICES];

  if (customerId) {
    result = result.filter((rs) => rs.customerId === customerId);
  }

  return {
    code: 200,
    message: '获取成功',
    data: result,
  };
};

export const createRecurringService = async (
  data: Omit<RecurringService, 'id' | 'createdAt' | 'address' | 'nextOrderDate' | 'isActive'> & { address?: Address }
): Promise<ApiResponse<RecurringService>> => {
  await delay(500);

  const newService: RecurringService = {
    ...data,
    address: data.address || MOCK_CUSTOMERS.find(c => c.id === data.customerId)?.addresses[0] || {} as Address,
    id: generateId(),
    nextOrderDate: getNextOrderDate(data.frequency),
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  MOCK_RECURRING_SERVICES.push(newService);

  return {
    code: 200,
    message: '创建成功',
    data: newService,
  };
};

export const toggleRecurringService = async (id: string): Promise<ApiResponse<null>> => {
  await delay(400);

  const index = MOCK_RECURRING_SERVICES.findIndex((rs) => rs.id === id);
  if (index === -1) {
    throw new Error('定期服务不存在');
  }

  MOCK_RECURRING_SERVICES[index] = {
    ...MOCK_RECURRING_SERVICES[index],
    isActive: !MOCK_RECURRING_SERVICES[index].isActive,
  };

  return {
    code: 200,
    message: '更新成功',
    data: null,
  };
};

export const getCleanerPerformances = async (
  month?: string
): Promise<ApiResponse<CleanerPerformance[]>> => {
  await delay(600);

  const targetMonth = month || new Date().toISOString().slice(0, 7);

  const performances: CleanerPerformance[] = MOCK_CLEANERS.map((cleaner) => {
    const totalOrders = Math.floor(Math.random() * 30) + 10;
    const avgRating = Math.round((Math.random() * 0.5 + 4.5) * 100) / 100;
    const badReviewCount = Math.floor(Math.random() * 3);
    const onTimeRate = Math.round((Math.random() * 0.1 + 0.9) * 100);

    const baseCommission = totalOrders * 100;
    const { bonus, total } = calculateCommission(
      baseCommission,
      avgRating,
      badReviewCount > 0
    );

    return {
      cleanerId: cleaner.id,
      cleaner,
      month: targetMonth,
      totalOrders,
      avgRating,
      badReviewCount,
      onTimeRate,
      baseCommission,
      bonusCommission: bonus,
      totalCommission: total,
    };
  });

  performances.sort((a, b) => b.totalCommission - a.totalCommission);

  return {
    code: 200,
    message: '获取成功',
    data: performances,
  };
};

export const updateCleanerSkills = async (
  cleanerId: string,
  skills: string[]
): Promise<ApiResponse<Cleaner>> => {
  await delay(400);

  const index = MOCK_CLEANERS.findIndex((c) => c.id === cleanerId);
  if (index === -1) {
    throw new Error('保洁员不存在');
  }

  MOCK_CLEANERS[index] = {
    ...MOCK_CLEANERS[index],
    skills: skills as Cleaner['skills'],
  };

  return {
    code: 200,
    message: '更新成功',
    data: MOCK_CLEANERS[index],
  };
};

export const getRecommendations = async (
  addressId: string,
  serviceType: string,
  customerId: string
): Promise<ApiResponse<{ cleaner: Cleaner; distance: number; matchScore: number }[]>> => {
  await delay(500);

  const customer = MOCK_CUSTOMERS.find((c) => c.id === customerId);
  const address = customer?.addresses.find((a) => a.id === addressId);

  if (!address) {
    throw new Error('地址不存在');
  }

  const availableCleaners = MOCK_CLEANERS.filter(
    (c) => c.status === 'available' && c.skills.includes(serviceType as Cleaner['skills'][number])
  );

  const recommendations = availableCleaners
    .map((cleaner) => {
      const distance =
        Math.round(
          Math.sqrt(
            Math.pow(cleaner.location.lat - address.location.lat, 2) +
              Math.pow(cleaner.location.lng - address.location.lng, 2)
          ) * 100
        ) / 10;

      const matchScore = Math.round(
        (cleaner.rating / 5 + (1 - distance / 10)) * 50
      );

      return {
        cleaner,
        distance,
        matchScore,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);

  return {
    code: 200,
    message: '获取成功',
    data: recommendations,
  };
};
