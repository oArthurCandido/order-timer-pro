
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useOrder } from "@/contexts/OrderContext";
import { formatDuration } from "@/lib/calculateProductionTime";
import { Calculator, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";

const OrderCalculator = () => {
  const { settings, calculateNewOrder, addOrder, loading } = useOrder();
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [item1Quantity, setItem1Quantity] = useState<number>(0);
  const [item2Quantity, setItem2Quantity] = useState<number>(0);
  const [calculationResult, setCalculationResult] = useState<{
    totalProductionTime: number;
    estimatedCompletionDate: Date;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCalculate = () => {
    if (!customerName || !customerEmail) {
      return;
    }

    const result = calculateNewOrder(
      customerName,
      customerEmail,
      item1Quantity,
      item2Quantity
    );

    setCalculationResult(result);
  };

  const handleAddOrder = async () => {
    if (!calculationResult) return;
    
    setIsSubmitting(true);
    
    try {
      const item1 = settings.items[0];
      const item2 = settings.items[1];

      const orderItems = [];

      if (item1Quantity > 0) {
        orderItems.push({
          id: item1.id,
          name: item1.name,
          quantity: item1Quantity,
          productionTimePerUnit: item1.productionTimePerUnit,
        });
      }

      if (item2Quantity > 0) {
        orderItems.push({
          id: item2.id,
          name: item2.name,
          quantity: item2Quantity,
          productionTimePerUnit: item2.productionTimePerUnit,
        });
      }

      await addOrder({
        customerName,
        customerEmail,
        items: orderItems,
        status: "pending",
        totalProductionTime: calculationResult.totalProductionTime,
        estimatedCompletionDate: calculationResult.estimatedCompletionDate,
      });

      // Reset form
      setCustomerName("");
      setCustomerEmail("");
      setItem1Quantity(0);
      setItem2Quantity(0);
      setCalculationResult(null);
    } catch (error) {
      console.error("Error adding order:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className="card-gradient">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Calculator className="h-5 w-5 text-primary" />
            <CardTitle>Order Time Calculator</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="py-8">
          <div className="flex justify-center">
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
          <Calculator className="h-5 w-5 text-primary" />
          <CardTitle>Order Time Calculator</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="customerName">Customer Name</Label>
            <Input
              id="customerName"
              placeholder="John Doe"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="customerEmail">Customer Email</Label>
            <Input
              id="customerEmail"
              type="email"
              placeholder="john@example.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="item1">{settings.items[0].name}</Label>
            <Input
              id="item1"
              type="number"
              min="0"
              value={item1Quantity}
              onChange={(e) => setItem1Quantity(Number(e.target.value))}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="item2">{settings.items[1].name}</Label>
            <Input
              id="item2"
              type="number"
              min="0"
              value={item2Quantity}
              onChange={(e) => setItem2Quantity(Number(e.target.value))}
              className="mt-1"
            />
          </div>
        </div>

        <Button 
          onClick={handleCalculate} 
          className="w-full"
          disabled={!customerName || !customerEmail || (item1Quantity === 0 && item2Quantity === 0)}
        >
          <Clock className="mr-2 h-4 w-4" />
          Calculate Production Time
        </Button>

        {calculationResult && (
          <div className="mt-4 p-4 bg-accent rounded-lg">
            <h3 className="font-semibold mb-2">Calculation Results</h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Production Time:</span>{" "}
                {formatDuration(calculationResult.totalProductionTime)}
              </p>
              <p>
                <span className="font-medium">Estimated Completion:</span>{" "}
                {format(calculationResult.estimatedCompletionDate, "PPpp")}
              </p>
            </div>
          </div>
        )}
      </CardContent>
      {calculationResult && (
        <CardFooter>
          <Button 
            variant="default" 
            className="w-full gradient-bg"
            onClick={handleAddOrder}
            disabled={isSubmitting}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {isSubmitting ? "Adding to Queue..." : "Accept and Add to Queue"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default OrderCalculator;
