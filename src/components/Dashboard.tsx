import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrder } from "@/contexts/OrderContext";
import { BarChart, LineChart, PieChart } from "lucide-react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";
import { format, subDays, isWithinInterval, startOfDay, endOfDay, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Order } from "@/types/order";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const Dashboard = () => {
  const { orders } = useOrder();

  // Calculate dashboard metrics
  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.status === "completed").length;
  const cancelledOrders = orders.filter((o) => o.status === "cancelled").length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const inProgressOrders = orders.filter((o) => o.status === "in-progress").length;

  // Calculate actual production time based on accumulated time and current progress
  const getActualProductionTime = (order: Order): number => {
    let time = order.productionTimeAccumulated || 0;
    
    // If order is in progress, add the current running time
    if (order.status === 'in-progress' && order.productionStartTime) {
      time += differenceInMinutes(new Date(), new Date(order.productionStartTime));
    }
    
    return time;
  };

  // Use actual production time for calculations
  const ordersWithActualTime = orders.map(order => ({
    ...order,
    actualProductionTime: getActualProductionTime(order)
  }));
  
  const totalActualProductionTime = ordersWithActualTime
    .filter(o => o.status === "completed" || o.status === "in-progress")
    .reduce((total, order) => total + order.actualProductionTime, 0);
  
  const averageActualProductionTime = 
    ordersWithActualTime.filter(o => o.status === "completed").length > 0
      ? Math.round(totalActualProductionTime / ordersWithActualTime.filter(o => o.status === "completed").length)
      : 0;

  // Total items produced
  const totalItems = orders
    .filter((o) => o.status === "completed")
    .flatMap((o) => o.items)
    .reduce((sum, item) => sum + item.quantity, 0);

  // Status distribution for pie chart
  const statusData = [
    { name: "Concluído", value: completedOrders },
    { name: "Pendente", value: pendingOrders },
    { name: "Em Produção", value: inProgressOrders },
    { name: "Cancelado", value: cancelledOrders },
  ].filter((item) => item.value > 0);

  // Orders by day for the last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), i);
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    
    const ordersOnDay = orders.filter((order) =>
      isWithinInterval(new Date(order.createdAt), { start: dayStart, end: dayEnd })
    );
    
    return {
      name: format(date, "EEE", { locale: ptBR }),
      orders: ordersOnDay.length,
      completed: ordersOnDay.filter((o) => o.status === "completed").length,
    };
  }).reverse();

  // Production time by product using actual time
  const productionByProduct = ordersWithActualTime
    .filter(order => order.status === "completed" || order.status === "in-progress")
    .flatMap((order) => 
      order.items.map(item => ({
        name: item.name,
        units: item.quantity,
        // Divide the actual production time proportionally based on item production time weight
        time: Math.round(
          (order.actualProductionTime * (item.quantity * item.productionTimePerUnit)) / 
          order.items.reduce((sum, i) => sum + (i.quantity * i.productionTimePerUnit), 0)
        )
      }))
    )
    .reduce((acc, item) => {
      const existing = acc.find((p) => p.name === item.name);
      if (existing) {
        existing.units += item.units;
        existing.time += item.time;
      } else {
        acc.push({
          name: item.name,
          units: item.units,
          time: item.time,
        });
      }
      return acc;
    }, [] as { name: string; units: number; time: number }[]);

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-gradient">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Concluídos: {completedOrders} | Pendentes: {pendingOrders}
            </p>
          </CardContent>
        </Card>
        
        <Card className="card-gradient">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio de Produção</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averageActualProductionTime} min
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Baseado no tempo real de produção
            </p>
          </CardContent>
        </Card>
        
        <Card className="card-gradient">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Itens Produzidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Em todos os pedidos concluídos
            </p>
          </CardContent>
        </Card>
        
        <Card className="card-gradient">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Fila Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders + inProgressOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Em produção: {inProgressOrders} | Aguardando: {pendingOrders}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Day */}
        <Card className="card-gradient">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <BarChart className="h-5 w-5 text-primary" />
              <CardTitle>Pedidos por Dia</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsBarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="orders" name="Total de Pedidos" fill="#0088FE" />
                <Bar dataKey="completed" name="Concluídos" fill="#00C49F" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Order Status Distribution */}
        <Card className="card-gradient">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <PieChart className="h-5 w-5 text-primary" />
              <CardTitle>Distribuição por Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex justify-center">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado de pedido disponível
              </div>
            )}
          </CardContent>
        </Card>

        {/* Production Time by Product */}
        <Card className="card-gradient lg:col-span-2">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <LineChart className="h-5 w-5 text-primary" />
              <CardTitle>Estatísticas por Produto</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {productionByProduct.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart
                  data={productionByProduct}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" stroke="#0088FE" />
                  <YAxis yAxisId="right" orientation="right" stroke="#00C49F" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="units" name="Unidades" fill="#0088FE" />
                  <Bar yAxisId="right" dataKey="time" name="Tempo de Produção (min)" fill="#00C49F" />
                </RechartsBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado de produção disponível
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
