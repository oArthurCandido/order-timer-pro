
import { Order, ProductionSettings } from "@/types/order";

export function calculateProductionTime(item1Quantity: number, item2Quantity: number, settings: ProductionSettings): number {
  // Get the production time for each item
  const item1 = settings.items[0];
  const item2 = settings.items[1];
  
  // Calculate total production time in minutes
  const item1Time = item1.productionTimePerUnit * item1Quantity;
  const item2Time = item2.productionTimePerUnit * item2Quantity;
  
  return item1Time + item2Time;
}

export function calculateEstimatedCompletionDate(
  productionTime: number,
  queuedProductionTime: number,
  settings: ProductionSettings,
  startDate = new Date()
): Date {
  // Total time needed is the sum of production time plus queued time
  const totalMinutesNeeded = productionTime + queuedProductionTime;
  
  // Convert working hours to minutes
  const workingMinutesPerDay = settings.workingHoursPerDay * 60;
  
  // Parse start and end times
  const [startHour, startMinute] = settings.startTime.split(':').map(Number);
  const [endHour, endMinute] = settings.endTime.split(':').map(Number);
  
  // Clone the start date to avoid modifying the original
  const estimatedDate = new Date(startDate);
  
  // Set initial time to start time
  estimatedDate.setHours(startHour, startMinute, 0, 0);
  
  // If current time is before start time, use start time of today
  const now = new Date();
  if (
    now.getHours() < startHour || 
    (now.getHours() === startHour && now.getMinutes() < startMinute)
  ) {
    estimatedDate.setHours(startHour, startMinute, 0, 0);
  } else if (
    now.getHours() > endHour || 
    (now.getHours() === endHour && now.getMinutes() > endMinute)
  ) {
    // If current time is after end time, use start time of next working day
    estimatedDate.setDate(estimatedDate.getDate() + 1);
    estimatedDate.setHours(startHour, startMinute, 0, 0);
    
    // Find the next working day
    while (!settings.workingDays.includes(estimatedDate.getDay())) {
      estimatedDate.setDate(estimatedDate.getDate() + 1);
    }
  } else {
    // Use current time
    estimatedDate.setHours(now.getHours(), now.getMinutes(), 0, 0);
  }
  
  let remainingMinutes = totalMinutesNeeded;
  
  // Continue adding days until we've accounted for all the required time
  while (remainingMinutes > 0) {
    // Check if current day is a working day
    if (settings.workingDays.includes(estimatedDate.getDay())) {
      const currentHour = estimatedDate.getHours();
      const currentMinute = estimatedDate.getMinutes();
      
      // Calculate how many minutes are left in the current working day
      const endTimeInMinutes = endHour * 60 + endMinute;
      const currentTimeInMinutes = currentHour * 60 + currentMinute;
      const minutesLeftToday = Math.max(0, endTimeInMinutes - currentTimeInMinutes);
      
      if (remainingMinutes <= minutesLeftToday) {
        // Add the remaining minutes to the current time
        estimatedDate.setMinutes(currentMinute + remainingMinutes);
        remainingMinutes = 0;
      } else {
        // Use up the minutes left today and move to the next day
        remainingMinutes -= minutesLeftToday;
        estimatedDate.setDate(estimatedDate.getDate() + 1);
        estimatedDate.setHours(startHour, startMinute, 0, 0);
      }
    } else {
      // Move to the next day if it's not a working day
      estimatedDate.setDate(estimatedDate.getDate() + 1);
      estimatedDate.setHours(startHour, startMinute, 0, 0);
    }
  }
  
  return estimatedDate;
}

export function getTotalQueuedProductionTime(orders: Order[]): number {
  return orders
    .filter(order => order.status === 'pending' || order.status === 'in-progress')
    .reduce((total, order) => total + order.totalProductionTime, 0);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  }
  
  return `${hours} hour${hours === 1 ? '' : 's'} and ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}`;
}
