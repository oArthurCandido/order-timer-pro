
import { useEffect, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrder } from "@/contexts/OrderContext";
import { addDays, isWithinInterval, startOfDay, endOfDay, format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

type DayStatus = "free" | "busy" | "full";

interface DayData {
  date: Date;
  status: DayStatus;
  ordersCount: number;
  totalMinutes: number;
  minutesAvailable: number;
}

const ProductionCalendar = () => {
  const { orders, settings } = useOrder();
  const [calendarDays, setCalendarDays] = useState<Record<string, DayData>>({});
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedDayOrders, setSelectedDayOrders] = useState<any[]>([]);

  // Calculate day availability for the next 60 days
  useEffect(() => {
    const dayData: Record<string, DayData> = {};
    const today = startOfDay(new Date());
    const activeOrders = orders.filter(order => 
      order.status === "pending" || order.status === "in-progress"
    );

    // Calculate minutes available per day based on settings
    const minutesPerDay = settings.workingHoursPerDay * 60;

    // Generate next 60 days
    for (let i = 0; i < 60; i++) {
      const currentDate = addDays(today, i);
      const dayKey = format(currentDate, "yyyy-MM-dd");
      const dayOfWeek = currentDate.getDay();
      
      // Check if this day is a working day
      const isWorkingDay = settings.workingDays.includes(dayOfWeek);
      
      if (!isWorkingDay) {
        dayData[dayKey] = {
          date: currentDate, 
          status: "full", 
          ordersCount: 0,
          totalMinutes: 0,
          minutesAvailable: 0
        };
        continue;
      }
      
      // Calculate total production minutes scheduled for this day
      const dayStart = startOfDay(currentDate);
      const dayEnd = endOfDay(currentDate);
      
      const ordersForDay = activeOrders.filter(order => 
        isWithinInterval(new Date(order.estimatedCompletionDate), {
          start: dayStart,
          end: dayEnd
        })
      );
      
      const totalMinutesForDay = ordersForDay.reduce(
        (sum, order) => sum + order.totalProductionTime, 
        0
      );
      
      // Determine day status
      let status: DayStatus = "free";
      if (totalMinutesForDay > 0) {
        status = totalMinutesForDay >= minutesPerDay ? "full" : "busy";
      }
      
      dayData[dayKey] = {
        date: currentDate,
        status,
        ordersCount: ordersForDay.length,
        totalMinutes: totalMinutesForDay,
        minutesAvailable: Math.max(0, minutesPerDay - totalMinutesForDay)
      };
    }
    
    setCalendarDays(dayData);
  }, [orders, settings]);

  // Update selected day orders when date changes
  useEffect(() => {
    if (!selectedDate) return;
    
    const selectedDayStart = startOfDay(selectedDate);
    const selectedDayEnd = endOfDay(selectedDate);
    
    const ordersForSelectedDay = orders.filter(order => 
      isWithinInterval(new Date(order.estimatedCompletionDate), {
        start: selectedDayStart,
        end: selectedDayEnd
      })
    );
    
    setSelectedDayOrders(ordersForSelectedDay);
  }, [selectedDate, orders]);

  // This function is causing the TypeScript error because it's used incorrectly in the Calendar component
  const getColorClass = (date: Date): string => {
    const dayKey = format(date, "yyyy-MM-dd");
    const dayData = calendarDays[dayKey];
    
    if (!dayData) return "";
    
    switch (dayData.status) {
      case "free":
        return "bg-green-50 text-green-700 hover:bg-green-100";
      case "busy":
        return "bg-yellow-50 text-yellow-700 hover:bg-yellow-100";
      case "full":
        return "bg-red-50 text-red-700 hover:bg-red-100";
      default:
        return "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="mr-2 h-5 w-5 text-primary" />
          Production Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              modifiersStyles={{
                selected: {
                  fontWeight: "bold",
                  borderWidth: "2px",
                  borderColor: "var(--primary)"
                }
              }}
              modifiers={{
                free: (date) => {
                  const dayKey = format(date, "yyyy-MM-dd");
                  return calendarDays[dayKey]?.status === "free";
                },
                busy: (date) => {
                  const dayKey = format(date, "yyyy-MM-dd");
                  return calendarDays[dayKey]?.status === "busy";
                },
                full: (date) => {
                  const dayKey = format(date, "yyyy-MM-dd");
                  return calendarDays[dayKey]?.status === "full";
                }
              }}
              // Fix: Replace "styles" with "classNames" and properly format the class names
              classNames={{
                day_free: "bg-green-50 text-green-700 hover:bg-green-100",
                day_busy: "bg-yellow-50 text-yellow-700 hover:bg-yellow-100",
                day_full: "bg-red-50 text-red-700 hover:bg-red-100"
              }}
            />
            <div className="flex justify-center gap-4 mt-4">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span className="text-sm">Free</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                <span className="text-sm">Partially Filled</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                <span className="text-sm">Full or Non-Working</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-lg mb-3">
              {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
            </h3>
            
            {selectedDate && (
              <>
                <div className="mb-4">
                  {(() => {
                    const dayKey = format(selectedDate, "yyyy-MM-dd");
                    const dayData = calendarDays[dayKey];
                    
                    if (!dayData) return <p>No data available</p>;
                    
                    const isWorkingDay = settings.workingDays.includes(selectedDate.getDay());
                    
                    if (!isWorkingDay) {
                      return <Badge variant="secondary">Non-Working Day</Badge>;
                    }
                    
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={dayData.status === "free" ? "outline" : dayData.status === "busy" ? "secondary" : "destructive"}>
                            {dayData.status === "free" ? "Free" : dayData.status === "busy" ? "Partially Filled" : "Full"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {dayData.ordersCount} orders
                          </span>
                        </div>
                        
                        <div className="text-sm">
                          <p><span className="font-medium">Working hours:</span> {settings.startTime} - {settings.endTime}</p>
                          <p><span className="font-medium">Production capacity:</span> {settings.workingHoursPerDay * 60} minutes</p>
                          <p><span className="font-medium">Scheduled production:</span> {dayData.totalMinutes} minutes</p>
                          <p><span className="font-medium">Available capacity:</span> {dayData.minutesAvailable} minutes</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                
                {selectedDayOrders.length > 0 ? (
                  <div>
                    <h4 className="font-medium mb-2">Orders scheduled for this day:</h4>
                    <ul className="space-y-2">
                      {selectedDayOrders.map(order => (
                        <li key={order.id} className="p-2 border rounded-md">
                          <div className="flex justify-between items-center">
                            <p className="font-medium">{order.customerName}</p>
                            {order.status === "pending" && <Badge variant="outline" className="bg-blue-100 text-blue-700">Pending</Badge>}
                            {order.status === "in-progress" && <Badge variant="outline" className="bg-yellow-100 text-yellow-700">In Progress</Badge>}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {order.items.map((item: any) => `${item.quantity}x ${item.name}`).join(', ')}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No orders scheduled for this day</p>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductionCalendar;
