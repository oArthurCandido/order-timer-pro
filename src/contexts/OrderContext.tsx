import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { Order, ProductionSettings, OrderStatus } from "@/types/order";
import {
  calculateEstimatedCompletionDate,
  calculateProductionTime,
  getTotalQueuedProductionTime,
} from "@/lib/calculateProductionTime";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

interface OrderContextValue {
  orders: Order[];
  settings: ProductionSettings;
  addOrder: (
    order: Omit<
      Order,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "queuePosition"
      | "productionTimeAccumulated"
      | "productionStartTime"
    >
  ) => Promise<void>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  updateOrderPosition: (id: string, newPosition: number) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  updateSettings: (newSettings: ProductionSettings) => Promise<void>;
  calculateNewOrder: (
    customerName: string,
    customerEmail: string,
    item1Quantity: number,
    item2Quantity: number
  ) => {
    totalProductionTime: number;
    estimatedCompletionDate: Date;
  };
  loading: boolean;
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
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setSettings(defaultSettings);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: settingsData, error: settingsError } = await supabase
          .from("production_settings")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (settingsError) throw settingsError;

        if (settingsData) {
          setSettings({
            items: [
              {
                id: "1",
                name: settingsData.item1_name,
                productionTimePerUnit: settingsData.item1_production_time,
              },
              {
                id: "2",
                name: settingsData.item2_name,
                productionTimePerUnit: settingsData.item2_production_time,
              },
            ],
            workingHoursPerDay: settingsData.working_hours_per_day,
            startTime: settingsData.start_time,
            endTime: settingsData.end_time,
            workingDays: settingsData.working_days,
          });
        } else {
          const { error: insertError } = await supabase
            .from("production_settings")
            .insert({
              user_id: user.id,
              item1_name: defaultSettings.items[0].name,
              item1_production_time:
                defaultSettings.items[0].productionTimePerUnit,
              item2_name: defaultSettings.items[1].name,
              item2_production_time:
                defaultSettings.items[1].productionTimePerUnit,
              working_hours_per_day: defaultSettings.workingHoursPerDay,
              start_time: defaultSettings.startTime,
              end_time: defaultSettings.endTime,
              working_days: defaultSettings.workingDays,
            });

          if (insertError) throw insertError;
        }

        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", user.id)
          .order("queue_position", { ascending: true });

        if (ordersError) throw ordersError;

        if (ordersData) {
          const transformedOrders: Order[] = ordersData.map((order) => ({
            id: order.id,
            customerName: order.customer_name,
            customerEmail: order.customer_email,
            items: [
              ...(order.item1_quantity > 0
                ? [
                    {
                      id: "1",
                      name: settings.items[0].name,
                      quantity: order.item1_quantity,
                      productionTimePerUnit:
                        settings.items[0].productionTimePerUnit,
                    },
                  ]
                : []),
              ...(order.item2_quantity > 0
                ? [
                    {
                      id: "2",
                      name: settings.items[1].name,
                      quantity: order.item2_quantity,
                      productionTimePerUnit:
                        settings.items[1].productionTimePerUnit,
                    },
                  ]
                : []),
            ],
            status: order.status as OrderStatus,
            totalProductionTime: order.total_production_time,
            estimatedCompletionDate: new Date(order.estimated_completion_date),
            queuePosition: order.queue_position,
            createdAt: new Date(order.created_at),
            updatedAt: new Date(order.updated_at),
            productionStartTime: order.production_start_time
              ? new Date(order.production_start_time)
              : undefined,
            productionTimeAccumulated: order.production_time_accumulated || 0,
          }));

          setOrders(transformedOrders);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load your data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const calculateNewOrder = (
    customerName: string,
    customerEmail: string,
    item1Quantity: number,
    item2Quantity: number
  ) => {
    const totalProductionTime = calculateProductionTime(
      item1Quantity,
      item2Quantity,
      settings
    );

    const queuedProductionTime = getTotalQueuedProductionTime(orders);

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

  const addOrder = async (
    orderData: Omit<
      Order,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "queuePosition"
      | "productionTimeAccumulated"
      | "productionStartTime"
    >
  ) => {
    if (!user) {
      toast.error("You must be logged in to add orders");
      return;
    }

    try {
      // Calculate next queue position
      const queuePosition =
        orders.filter(
          (o) => o.status === "pending" || o.status === "in-progress"
        ).length + 1;

      const item1 = orderData.items.find((item) => item.id === "1");
      const item2 = orderData.items.find((item) => item.id === "2");

      const { data, error } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          customer_name: orderData.customerName,
          customer_email: orderData.customerEmail,
          item1_quantity: item1?.quantity || 0,
          item2_quantity: item2?.quantity || 0,
          status: orderData.status,
          total_production_time: orderData.totalProductionTime,
          estimated_completion_date:
            orderData.estimatedCompletionDate.toISOString(),
          queue_position: queuePosition,
          production_time_accumulated: 0,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        // Manually fetch the updated order list instead of trying to update it in memory
        await fetchOrders();
        toast.success("Order added successfully");
      }
    } catch (error: any) {
      console.error("Error adding order:", error);
      toast.error(error.message || "Failed to add order");
    }
  };

  // New function to fetch orders - reused to avoid code duplication
  const fetchOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("queue_position", { ascending: true });

      if (error) throw error;

      if (data) {
        const transformedOrders: Order[] = data.map((order) => ({
          id: order.id,
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          items: [
            ...(order.item1_quantity > 0
              ? [
                  {
                    id: "1",
                    name: settings.items[0].name,
                    quantity: order.item1_quantity,
                    productionTimePerUnit:
                      settings.items[0].productionTimePerUnit,
                  },
                ]
              : []),
            ...(order.item2_quantity > 0
              ? [
                  {
                    id: "2",
                    name: settings.items[1].name,
                    quantity: order.item2_quantity,
                    productionTimePerUnit:
                      settings.items[1].productionTimePerUnit,
                  },
                ]
              : []),
          ],
          status: order.status as OrderStatus,
          totalProductionTime: order.total_production_time,
          estimatedCompletionDate: new Date(order.estimated_completion_date),
          queuePosition: order.queue_position,
          createdAt: new Date(order.created_at),
          updatedAt: new Date(order.updated_at),
          productionStartTime: order.production_start_time
            ? new Date(order.production_start_time)
            : undefined,
          productionTimeAccumulated: order.production_time_accumulated || 0,
        }));

        setOrders(transformedOrders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to refresh orders");
    }
  };

  // const updateOrderStatus = async (id: string, status: OrderStatus) => {
  //   if (!user) return;

  //   try {
  //     // Simplified update - only update the status and let DB triggers handle the rest
  //     const { error } = await supabase
  //       .from("orders")
  //       .update({ status })
  //       .eq("id", id)
  //       .eq("user_id", user.id);

  //     if (error) throw error;

  //     // Fetch the updated data from the server instead of trying to calculate it
  //     // With:
  //     const { data } = await supabase
  //       .from("orders")
  //       .select("*")
  //       .eq("user_id", user.id);
  //     console.log("Updated order:", data);
  //     toast.success(`Order status updated to ${status}`);
  //   } catch (error: any) {
  //     console.error("Error updating order status:", error);
  //     toast.error(error.message || "Failed to update order status");
  //   }
  // };

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      // Add a small delay to break any potential recursive loop
      setTimeout(() => {
        fetchOrders();
      }, 100);

      toast.success(`Order status updated to ${status}`);
    } catch (error: any) {
      console.error("Error updating order status:", error);
      toast.error(error.message || "Failed to update order status");
    }
  };

  const updateOrderPosition = async (id: string, newPosition: number) => {
    if (!user) return;

    try {
      // Simplified position update
      const { error } = await supabase
        .from("orders")
        .update({ queue_position: newPosition })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      // Fetch fresh data instead of trying to modify it in memory
      await fetchOrders();
      toast.success("Order position updated");
    } catch (error: any) {
      console.error("Error updating order position:", error);
      toast.error(error.message || "Failed to update order position");
    }
  };

  const deleteOrder = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      // Just filter the deleted order from local state
      setOrders((prev) => prev.filter((order) => order.id !== id));
      toast.success("Order deleted");

      // Then refresh the queue positions
      await fetchOrders();
    } catch (error: any) {
      console.error("Error deleting order:", error);
      toast.error(error.message || "Failed to delete order");
    }
  };

  const updateSettings = async (newSettings: ProductionSettings) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("production_settings")
        .update({
          item1_name: newSettings.items[0].name,
          item1_production_time: newSettings.items[0].productionTimePerUnit,
          item2_name: newSettings.items[1].name,
          item2_production_time: newSettings.items[1].productionTimePerUnit,
          working_hours_per_day: newSettings.workingHoursPerDay,
          start_time: newSettings.startTime,
          end_time: newSettings.endTime,
          working_days: newSettings.workingDays,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      setSettings(newSettings);
      toast.success("Production settings updated");
    } catch (error: any) {
      console.error("Error updating settings:", error);
      toast.error(error.message || "Failed to update settings");
    }
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
    loading,
  };

  return (
    <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
  );
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error("useOrder must be used within an OrderProvider");
  }
  return context;
}
