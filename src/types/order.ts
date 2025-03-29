
export type OrderStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  productionTimePerUnit: number; // in minutes
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  status: OrderStatus;
  totalProductionTime: number; // in minutes
  estimatedCompletionDate: Date;
  queuePosition: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductionSettings {
  items: {
    id: string;
    name: string;
    productionTimePerUnit: number; // in minutes
  }[];
  workingHoursPerDay: number; // in hours
  startTime: string; // format: "HH:MM"
  endTime: string; // format: "HH:MM"
  workingDays: number[]; // 0 = Sunday, 1 = Monday, etc.
}
