
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
  { id: 0, name: "Sunday" },
  { id: 1, name: "Monday" },
  { id: 2, name: "Tuesday" },
  { id: 3, name: "Wednesday" },
  { id: 4, name: "Thursday" },
  { id: 5, name: "Friday" },
  { id: 6, name: "Saturday" },
];

const ProductionSettings = () => {
  const { settings, updateSettings } = useOrder();
  const [localSettings, setLocalSettings] = useState<Settings>(settings);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(localSettings);
  };

  return (
    <Card className="card-gradient">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-primary" />
          <CardTitle>Production Settings</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Item Production Times</h3>
              {localSettings.items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <Label htmlFor={`item-name-${index}`}>Item Name</Label>
                    <Input
                      id={`item-name-${index}`}
                      value={item.name}
                      onChange={(e) => handleItemChange(index, "name", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`item-time-${index}`}>Production Time (minutes per unit)</Label>
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
                <Label htmlFor="workingHours">Working Hours Per Day</Label>
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
                <Label htmlFor="startTime">Start Time</Label>
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
                <Label htmlFor="endTime">End Time</Label>
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
              <Label className="block mb-2">Working Days</Label>
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

          <Button type="submit" className="w-full">
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProductionSettings;
