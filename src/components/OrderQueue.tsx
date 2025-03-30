
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrder } from "@/contexts/OrderContext";
import { formatDuration } from "@/lib/calculateProductionTime";
import { differenceInMinutes, format } from "date-fns";
import { Clock, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const OrderQueue = () => {
  const { orders, updateOrderStatus, loading } = useOrder();
  const [localLoading, setLocalLoading] = useState(false);

  // Filter for pending orders and sort by queue position
  const pendingOrders = orders
    .filter((order) => order.status === "pending")
    .sort((a, b) => a.queuePosition - b.queuePosition);

  // Get the current in-progress order if any
  const inProgressOrder = orders.find((order) => order.status === "in-progress");

  // Calculate current production time for in-progress orders
  const getActualProductionTime = (order: any): number => {
    let time = order.productionTimeAccumulated || 0;
    
    // If order is in progress, add the current running time
    if (order.status === 'in-progress' && order.productionStartTime) {
      time += differenceInMinutes(new Date(), new Date(order.productionStartTime));
    }
    
    return time;
  };

  // Force re-render every minute to update production times
  useEffect(() => {
    if (inProgressOrder) {
      const timer = setInterval(() => {
        // This empty setState will trigger a re-render
        setLocalLoading(prev => prev);
      }, 60000); // every minute
      
      return () => clearInterval(timer);
    }
  }, [inProgressOrder]);

  const handleStartNextOrder = async () => {
    if (pendingOrders.length === 0) return;
    
    try {
      setLocalLoading(true);
      await updateOrderStatus(pendingOrders[0].id, "in-progress");
    } catch (error) {
      console.error("Error starting order:", error);
      toast.error("Failed to start the order. Please try again.");
    } finally {
      setLocalLoading(false);
    }
  };

  if (loading || localLoading) {
    return (
      <Card className="card-gradient">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-primary" />
            <CardTitle>Production Queue</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="py-8">
          <div className="flex justify-center" data-testid="loading">
            <div className="animate-spin">
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-gradient">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-primary" />
          <CardTitle>Production Queue</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {inProgressOrder ? (
          <div className="mb-4">
            <h3 className="font-medium mb-2 flex items-center">
              <Play className="h-4 w-4 text-green-500 mr-2" />
              Currently In Progress
            </h3>
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <div className="flex justify-between mb-1">
                <span className="font-medium">{inProgressOrder.customerName}</span>
                <span className="text-sm text-muted-foreground">
                  {formatDuration(getActualProductionTime(inProgressOrder))} / {formatDuration(inProgressOrder.totalProductionTime)}
                </span>
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                {inProgressOrder.items.map((item: any) => (
                  <span key={item.id} className="mr-2">
                    {item.quantity}x {item.name}
                  </span>
                ))}
              </div>
              <div className="text-xs text-muted-foreground">
                Est. completion: {format(new Date(inProgressOrder.estimatedCompletionDate), "PPp")}
              </div>
            </div>
          </div>
        ) : (
          pendingOrders.length > 0 && (
            <div className="flex justify-between items-center p-3 border border-dashed border-primary/40 rounded-lg">
              <span className="text-sm">No order in progress</span>
              <button
                onClick={handleStartNextOrder}
                disabled={loading || localLoading}
                className="text-xs px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded transition-colors disabled:opacity-50"
              >
                Start Next Order
              </button>
            </div>
          )
        )}

        <h3 className="font-medium mb-2">Pending Orders</h3>
        {pendingOrders.length === 0 ? (
          <div className="text-center p-4 text-muted-foreground">
            No pending orders in queue
          </div>
        ) : (
          <div className="space-y-2">
            {pendingOrders.map((order) => (
              <div
                key={order.id}
                className="p-3 bg-background/50 border border-border rounded-lg"
              >
                <div className="flex justify-between mb-1">
                  <span className="font-medium">{order.customerName}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDuration(order.totalProductionTime)}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  {order.items.map((item) => (
                    <span key={item.id} className="mr-2">
                      {item.quantity}x {item.name}
                    </span>
                  ))}
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    Position: {order.queuePosition}
                  </span>
                  <span className="text-muted-foreground">
                    Est. completion: {format(new Date(order.estimatedCompletionDate), "PPp")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderQueue;
