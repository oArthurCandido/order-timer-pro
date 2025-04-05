import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useOrder } from "@/contexts/OrderContext";
import { ProductionSettings as Settings } from "@/types/order";
import { Clock, Save } from "lucide-react";

const weekdays = [
  { id: 0, name: "Domingo" },
  { id: 1, name: "Segunda" },
  { id: 2, name: "Terça" },
  { id: 3, name: "Quarta" },
  { id: 4, name: "Quinta" },
  { id: 5, name: "Sexta" },
  { id: 6, name: "Sábado" },
];

const ProductionSettings = () => {
  const { settings, updateSettings, loading } = useOrder();
  const [localSettings, setLocalSettings] = useState<Settings>(settings);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update local state when settings from context change
  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const updatedItems = [...localSettings.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === "productionTimePerUnit" ? Number(value) : value,
    };

    setLocalSettings({
      ...localSettings,
      items: updatedItems,
    });
  };

  const handleWorkingDaysChange = (dayId: number, checked: boolean) => {
    let updatedWorkingDays = [...localSettings.workingDays];

    if (checked) {
      updatedWorkingDays.push(dayId);
    } else {
      updatedWorkingDays = updatedWorkingDays.filter((day) => day !== dayId);
    }

    setLocalSettings({
      ...localSettings,
      workingDays: updatedWorkingDays,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await updateSettings(localSettings);
    } catch (error) {
      console.error("Error updating settings:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className="card-gradient">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-primary" />
            <CardTitle>Configurações de Produção</CardTitle>
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
          <Clock className="h-5 w-5 text-primary" />
          <CardTitle>Configurações de Produção</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Tempos de Produção dos Itens</h3>
              {localSettings.items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <Label htmlFor={`item-name-${index}`}>Nome do Item</Label>
                    <Input
                      id={`item-name-${index}`}
                      value={item.name}
                      onChange={(e) => handleItemChange(index, "name", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`item-time-${index}`}>Tempo de Produção (minutos por unidade)</Label>
                    <Input
                      id={`item-time-${index}`}
                      type="number"
                      min="1"
                      value={item.productionTimePerUnit}
                      onChange={(e) => handleItemChange(index, "productionTimePerUnit", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="workingHours">Horas de Trabalho por Dia</Label>
                <Input
                  id="workingHours"
                  type="number"
                  min="1"
                  max="24"
                  value={localSettings.workingHoursPerDay}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      workingHoursPerDay: Number(e.target.value),
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="startTime">Horário de Início</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={localSettings.startTime}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      startTime: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="endTime">Horário de Término</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={localSettings.endTime}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      endTime: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="block mb-2">Dias de Trabalho</Label>
              <div className="flex flex-wrap gap-4">
                {weekdays.map((day) => (
                  <div key={day.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${day.id}`}
                      checked={localSettings.workingDays.includes(day.id)}
                      onCheckedChange={(checked) =>
                        handleWorkingDaysChange(day.id, checked === true)
                      }
                    />
                    <Label
                      htmlFor={`day-${day.id}`}
                      className="text-sm font-normal"
                    >
                      {day.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "Salvando Configurações..." : "Salvar Configurações"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProductionSettings;
