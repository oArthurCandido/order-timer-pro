
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OrderProvider, useOrder } from "@/contexts/OrderContext";
import OrderQueue from "./OrderQueue";
import { OrderStatus } from "@/types/order";

// Mock the OrderContext
vi.mock("@/contexts/OrderContext", () => ({
  useOrder: vi.fn(),
  OrderProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("OrderQueue Component", () => {
  const mockDefaultSettings = {
    items: [
      { id: "1", name: "Item 1", productionTimePerUnit: 10 },
      { id: "2", name: "Item 2", productionTimePerUnit: 15 },
    ],
    workingHoursPerDay: 8,
    startTime: "09:00",
    endTime: "17:00",
    workingDays: [1, 2, 3, 4, 5],
  };

  const mockEmptyContextValue = {
    orders: [],
    settings: mockDefaultSettings,
    addOrder: vi.fn(),
    updateOrderStatus: vi.fn(),
    updateOrderPosition: vi.fn(),
    deleteOrder: vi.fn(),
    updateSettings: vi.fn(),
    calculateNewOrder: vi.fn(),
    loading: false,
  };

  it("should show loading state", () => {
    (useOrder as any).mockReturnValue({
      ...mockEmptyContextValue,
      loading: true,
    });

    render(<OrderQueue />);
    expect(screen.getByText("Production Queue")).toBeInTheDocument();
    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });

  it("should show empty queue message when there are no orders", () => {
    (useOrder as any).mockReturnValue({
      ...mockEmptyContextValue,
      loading: false,
      orders: [],
    });

    render(<OrderQueue />);
    expect(screen.getByText("Production Queue")).toBeInTheDocument();
    expect(screen.getByText("No pending orders in queue")).toBeInTheDocument();
  });

  it("should show pending orders and allow starting next order when no order is in progress", () => {
    const mockUpdateOrderStatus = vi.fn();
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    
    const pendingOrders = [
      {
        id: "order1",
        customerName: "John Doe",
        customerEmail: "john@example.com",
        items: [
          { id: "1", name: "Item 1", quantity: 2, productionTimePerUnit: 10 },
        ],
        status: "pending" as OrderStatus,
        totalProductionTime: 20,
        estimatedCompletionDate: oneWeekFromNow,
        queuePosition: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (useOrder as any).mockReturnValue({
      ...mockEmptyContextValue,
      orders: pendingOrders,
      updateOrderStatus: mockUpdateOrderStatus,
    });

    render(<OrderQueue />);
    expect(screen.getByText("Production Queue")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Start Next Order")).toBeInTheDocument();
    
    fireEvent.click(screen.getByText("Start Next Order"));
    expect(mockUpdateOrderStatus).toHaveBeenCalledWith("order1", "in-progress");
  });

  it("should show in-progress order", () => {
    const inProgressOrder = {
      id: "order1",
      customerName: "Jane Smith",
      customerEmail: "jane@example.com",
      items: [
        { id: "1", name: "Item 1", quantity: 3, productionTimePerUnit: 10 },
        { id: "2", name: "Item 2", quantity: 1, productionTimePerUnit: 15 },
      ],
      status: "in-progress" as OrderStatus,
      totalProductionTime: 45,
      estimatedCompletionDate: new Date(),
      queuePosition: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const pendingOrder = {
      id: "order2",
      customerName: "Bob Johnson",
      customerEmail: "bob@example.com",
      items: [
        { id: "2", name: "Item 2", quantity: 2, productionTimePerUnit: 15 },
      ],
      status: "pending" as OrderStatus,
      totalProductionTime: 30,
      estimatedCompletionDate: new Date(),
      queuePosition: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (useOrder as any).mockReturnValue({
      ...mockEmptyContextValue,
      orders: [inProgressOrder, pendingOrder],
    });

    render(<OrderQueue />);
    expect(screen.getByText("Currently In Progress")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("3x Item 1")).toBeInTheDocument();
    expect(screen.getByText("1x Item 2")).toBeInTheDocument();
    expect(screen.getByText("Bob Johnson")).toBeInTheDocument();
  });
});
