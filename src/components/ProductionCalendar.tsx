
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { useOrder } from "@/contexts/OrderContext";
import { formatDuration } from "@/lib/calculateProductionTime";
import { addDays, format, isSameDay, isWeekend, startOfMonth } from "date-fns";
import { CheckCircle, Clock, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ProductionCalendar = () => {
  const { orders, settings, loading } = useOrder();
  const [date, setDate] = useState<Date>(new Date());
  const [calendarData, setCalendarData] = useState<{
    [date: string]: {
      orders: any[];
      totalTime: number;
      completed: number;
    };
  }>({});

  // Process orders for calendar view
  useEffect(() => {
    if (loading || !orders.length) return;

    // Create a map of dates to orders
    const dateMap: {
      [date: string]: {
        orders: any[];
        totalTime: number;
        completed: number;
      };
    } = {};

    // Add all active and completed orders
    orders.forEach((order) => {
      if (
        order.status === "pending" ||
        order.status === "in-progress" ||
        order.status === "completed"
      ) {
        const dateStr = format(
          new Date(order.estimatedCompletionDate),
          "yyyy-MM-dd"
        );
        
        if (!dateMap[dateStr]) {
          dateMap[dateStr] = {
            orders: [],
            totalTime: 0,
            completed: 0,
          };
        }
        
        dateMap[dateStr].orders.push(order);
        dateMap[dateStr].totalTime += order.totalProductionTime;
        
        if (order.status === "completed") {
          dateMap[dateStr].completed += 1;
        }
      }
    });

    setCalendarData(dateMap);
  }, [orders, loading]);

  // Check if a date has orders
  const hasOrders = (date: Date): boolean => {
    const dateStr = format(date, "yyyy-MM-dd");
    return !!calendarData[dateStr];
  };

  // Check if a date is a working day
  const isWorkingDay = (date: Date): boolean => {
    return settings.workingDays.includes(date.getDay());
  };

  // Format date for calendar day display
  const formatCalendarDay = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const data = calendarData[dateStr];
    
    if (!data) return null;
    
    return (
      <div className="flex flex-col items-center w-full">
        <span>{date.getDate()}</span>
        {data && (
          <div className="flex items-center mt-1 gap-1">
            {data.completed > 0 && (
              <Badge variant="outline" className="text-xs h-4 px-1 bg-green-500/10">
                <CheckCircle className="h-2 w-2 mr-0.5" />
                {data.completed}
              </Badge>
            )}
            {data.orders.length - data.completed > 0 && (
              <Badge variant="outline" className="text-xs h-4 px-1 bg-blue-500/10">
                <Clock className="h-2 w-2 mr-0.5" />
                {data.orders.length - data.completed}
              </Badge>
            )}
          </div>
        )}
      </div>
    );
  };

  // Get orders for selected date
  const getOrdersForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return calendarData[dateStr]?.orders || [];
  };

  // Selected date orders
  const selectedDateOrders = getOrdersForDate(date);

  // Calculate total estimated time for selected date
  const totalEstimatedTime = selectedDateOrders.reduce(
    (sum, order) => sum + order.totalProductionTime,
    0
  );

  // Calculate total actual production time for selected date
  const totalActualTime = selectedDateOrders.reduce(
    (sum, order) => {
      // For completed orders, use the accumulated time
      // For in-progress orders, use current accumulated time
      if (order.status === "completed" || order.status === "in-progress") {
        return sum + (order.productionTimeAccumulated || 0);
      }
      return sum;
    },
    0
  );

  // Check if selected date is today
  const isToday = isSameDay(date, new Date());

  // Calendar styling
  const calendarStyles = {
    day_today: "bg-primary/20 text-primary-foreground font-bold",
    day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100",
    day_range_middle: "day-range-middle",
    day_selected:
      "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
    day_outside: "day-outside text-muted-foreground opacity-50",
    day_disabled: "text-muted-foreground opacity-50",
    day_hidden: "invisible",
    caption: "flex justify-center pt-1 relative items-center",
    caption_label: "text-sm font-medium",
    nav: "space-x-1 flex items-center",
    nav_button:
      "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
    cell: "relative p-0 text-center focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent",
  };

  return (
    <Card className="card-gradient">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" /> Production Calendar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-5 gap-4">
          <div className="md:col-span-3">
            <TooltipProvider>
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => setDate(newDate || new Date())}
                className="border rounded-md p-3"
                classNames={calendarStyles}
                components={{
                  DayContent: ({ date }) => formatCalendarDay(date),
                }}
                modifiers={{
                  weekend: (date) => isWeekend(date),
                  withOrders: (date) => hasOrders(date),
                  nonWorkingDay: (date) => !isWorkingDay(date),
                }}
                modifiersStyles={{
                  weekend: { color: "var(--muted-foreground)" },
                  withOrders: { 
                    backgroundColor: "var(--primary-alpha-10)",
                    fontWeight: "bold" 
                  },
                  nonWorkingDay: { 
                    backgroundColor: "var(--muted-alpha-5)",
                    color: "var(--muted-foreground)" 
                  }
                }}
              />
            </TooltipProvider>
          </div>
          <div className="md:col-span-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  {format(date, "MMMM d, yyyy")}
                </h3>
                {isToday && (
                  <Badge variant="outline">Today</Badge>
                )}
              </div>

              {!isWorkingDay(date) && (
                <div className="bg-muted/20 text-muted-foreground rounded-md p-3 text-sm flex items-center">
                  <Info className="h-4 w-4 mr-2" />
                  Non-working day
                </div>
              )}

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Total Estimated Production Time:
                </div>
                <div className="font-medium text-lg">
                  {formatDuration(totalEstimatedTime)}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Total Actual Production Time:
                </div>
                <div className="font-medium text-lg">
                  {formatDuration(totalActualTime)}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Orders ({selectedDateOrders.length})</h4>
                {selectedDateOrders.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No orders for this date
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedDateOrders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-card border rounded-md p-2 text-sm"
                      >
                        <div className="flex justify-between">
                          <span className="font-medium">{order.customerName}</span>
                          {order.status === "completed" ? (
                            <Badge variant="outline" className="bg-green-500/10 text-green-500">
                              Completed
                            </Badge>
                          ) : order.status === "in-progress" ? (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-500">
                              In Progress
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
                              Pending
                            </Badge>
                          )}
                        </div>
                        <div className="text-muted-foreground mt-1">
                          {order.items.map((item) => (
                            <div key={item.id}>
                              {item.quantity}x {item.name}
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-2">
                          <span>Est: {formatDuration(order.totalProductionTime)}</span>
                          <span>
                            {order.status === "completed" && `Actual: ${formatDuration(order.productionTimeAccumulated)}`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductionCalendar;
