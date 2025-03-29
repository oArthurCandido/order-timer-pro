
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrder } from "@/contexts/OrderContext";
import { formatDuration } from "@/lib/calculateProductionTime";
import { format } from "date-fns";
import { PendingCircle, Play } from "lucide-react";

const OrderQueue = () => {
  const { orders, updateOrderStatus } = useOrder();

  // Filter for pending orders and sort by queue position
  const pendingOrders = orders
    .filter((order) => order.status === "pending")
    .sort((a, b) => a.queuePosition - b.queuePosition);

  // Get the current in-progress order if any
  const inProgressOrder = orders.find((order) => order.status === "in-progress");

  return (
    <Card className="card-gradient">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <PendingCircle className="h-5 w-5 text-primary" />
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
                  {formatDuration(inProgressOrder.totalProductionTime)}
                </span>
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                {inProgressOrder.items.map((item) => (
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
                onClick={() => updateOrderStatus(pendingOrders[0].id, "in-progress")}
                className="text-xs px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded transition-colors"
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
