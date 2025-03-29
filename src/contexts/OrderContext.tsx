
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Order, ProductionSettings, OrderStatus } from "@/types/order";
import { calculateEstimatedCompletionDate, calculateProductionTime, getTotalQueuedProductionTime } from "@/lib/calculateProductionTime";
import { toast } from "sonner";

interface OrderContextValue {
  orders: Order[];
  settings: ProductionSettings;
  addOrder: (order: Omit<Order, "id" | "createdAt" | "updatedAt" | "queuePosition">) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  updateOrderPosition: (id: string, newPosition: number) => void;
  deleteOrder: (id: string) => void;
  updateSettings: (newSettings: ProductionSettings) => void;
  calculateNewOrder: (
    customerName: string,
    customerEmail: string,
    item1Quantity: number,
    item2Quantity: number
  ) => {
    totalProductionTime: number;
    estimatedCompletionDate: Date;
  };
}

const defaultSettings: ProductionSettings = {
  items: [
    {
      id: "1",
      name: "Item 1",
      productionTimePerUnit: 10, // 10 minutes per unit
    },
    {
      id: "2",
      name: "Item 2",
      productionTimePerUnit: 15, // 15 minutes per unit
    },
  ],
  workingHoursPerDay: 8,
  startTime: "09:00",
  endTime: "17:00",
  workingDays: [1, 2, 3, 4, 5], // Monday to Friday
};

const OrderContext = createContext<OrderContextValue | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<ProductionSettings>(defaultSettings);

  // Load data from localStorage on initial render
  useEffect(() => {
    const savedOrders = localStorage.getItem("orders");
    const savedSettings = localStorage.getItem("productionSettings");

    if (savedOrders) {
      try {
        const parsedOrders = JSON.parse(savedOrders);
        // Convert string dates back to Date objects
        const formattedOrders = parsedOrders.map((order: any) => ({
          ...order,
          estimatedCompletionDate: new Date(order.estimatedCompletionDate),
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt),
        }));
        setOrders(formattedOrders);
      } catch (error) {
        console.error("Failed to parse saved orders:", error);
      }
    }

    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error("Failed to parse saved settings:", error);
      }
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("orders", JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem("productionSettings", JSON.stringify(settings));
  }, [settings]);

  const calculateNewOrder = (
    customerName: string,
    customerEmail: string,
    item1Quantity: number,
    item2Quantity: number
  ) => {
    // Calculate production time for the new order
    const totalProductionTime = calculateProductionTime(
      item1Quantity,
      item2Quantity,
      settings
    );

    // Calculate the total production time of all queued orders
    const queuedProductionTime = getTotalQueuedProductionTime(orders);

    // Calculate the estimated completion date
    const estimatedCompletionDate = calculateEstimatedCompletionDate(
      totalProductionTime,
      queuedProductionTime,
      settings
    );

    return {
      totalProductionTime,
      estimatedCompletionDate,
    };
  };

  const addOrder = (orderData: Omit<Order, "id" | "createdAt" | "updatedAt" | "queuePosition">) => {
    const now = new Date();
    const newOrder: Order = {
      ...orderData,
      id: `order-${Date.now()}`,
      queuePosition: orders.filter(o => o.status === 'pending' || o.status === 'in-progress').length + 1,
      createdAt: now,
      updatedAt: now,
    };

    setOrders((prev) => [...prev, newOrder]);
    toast.success("Order added successfully");
  };

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    setOrders((prev) => {
      const updatedOrders = prev.map((order) =>
        order.id === id
          ? { ...order, status, updatedAt: new Date() }
          : order
      );
      
      // Recalculate queue positions for pending and in-progress orders
      let position = 1;
      const reorderedOrders = updatedOrders.map(order => {
        if (order.status === 'pending' || order.status === 'in-progress') {
          const updatedOrder = { ...order, queuePosition: position };
          position++;
          return updatedOrder;
        }
        return order;
      });
      
      return reorderedOrders;
    });
    
    toast.success(`Order status updated to ${status}`);
  };

  const updateOrderPosition = (id: string, newPosition: number) => {
    setOrders((prev) => {
      const activeOrders = prev.filter(
        (o) => o.status === "pending" || o.status === "in-progress"
      );
      const otherOrders = prev.filter(
        (o) => o.status !== "pending" && o.status !== "in-progress"
      );
      
      // Find the order to be moved
      const orderToMove = activeOrders.find((o) => o.id === id);
      
      if (!orderToMove) {
        return prev;
      }
      
      // Remove the order from its current position
      const filteredOrders = activeOrders.filter((o) => o.id !== id);
      
      // Ensure the new position is within bounds
      const boundedPosition = Math.max(1, Math.min(newPosition, filteredOrders.length + 1));
      
      // Insert the order at the new position
      filteredOrders.splice(boundedPosition - 1, 0, {
        ...orderToMove,
        queuePosition: boundedPosition,
        updatedAt: new Date(),
      });
      
      // Update queue positions for all active orders
      const reorderedOrders = filteredOrders.map((order, index) => ({
        ...order,
        queuePosition: index + 1,
      }));
      
      toast.success("Order position updated");
      return [...reorderedOrders, ...otherOrders];
    });
  };

  const deleteOrder = (id: string) => {
    setOrders((prev) => {
      const updatedOrders = prev.filter((order) => order.id !== id);
      
      // Recalculate queue positions for pending and in-progress orders
      let position = 1;
      const reorderedOrders = updatedOrders.map(order => {
        if (order.status === 'pending' || order.status === 'in-progress') {
          const updatedOrder = { ...order, queuePosition: position };
          position++;
          return updatedOrder;
        }
        return order;
      });
      
      return reorderedOrders;
    });
    
    toast.success("Order deleted");
  };

  const updateSettings = (newSettings: ProductionSettings) => {
    setSettings(newSettings);
    toast.success("Production settings updated");
  };

  const value: OrderContextValue = {
    orders,
    settings,
    addOrder,
    updateOrderStatus,
    updateOrderPosition,
    deleteOrder,
    updateSettings,
    calculateNewOrder,
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error("useOrder must be used within an OrderProvider");
  }
  return context;
}
