
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, render } from '@/test/test-utils';
import OrderQueue from './OrderQueue';
import { useOrder } from '@/contexts/OrderContext';
import userEvent from '@testing-library/user-event';

// Mock the useOrder hook
vi.mock('@/contexts/OrderContext', () => {
  const updateOrderStatus = vi.fn();
  return {
    useOrder: vi.fn(() => ({
      loading: false,
      orders: [],
      updateOrderStatus,
    })),
  };
});

describe('OrderQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    // Set the mock to return loading=true
    vi.mocked(useOrder).mockReturnValueOnce({
      loading: true,
      orders: [],
      updateOrderStatus: vi.fn(),
    });

    render(<OrderQueue />);
    
    expect(screen.getByText('Production Queue')).toBeInTheDocument();
    expect(screen.queryByText('No pending orders in queue')).not.toBeInTheDocument();
  });

  it('renders empty queue message when no orders are pending', () => {
    // Set the mock to return an empty orders array
    vi.mocked(useOrder).mockReturnValueOnce({
      loading: false,
      orders: [],
      updateOrderStatus: vi.fn(),
    });

    render(<OrderQueue />);
    
    expect(screen.getByText('Production Queue')).toBeInTheDocument();
    expect(screen.getByText('No pending orders in queue')).toBeInTheDocument();
  });

  it('renders pending orders correctly', () => {
    // Set the mock to return orders with pending status
    const mockOrders = [
      {
        id: '1',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        items: [
          { id: '1', name: 'Item 1', quantity: 2, productionTimePerUnit: 10 },
        ],
        status: 'pending',
        totalProductionTime: 20,
        estimatedCompletionDate: new Date(),
        queuePosition: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(useOrder).mockReturnValueOnce({
      loading: false,
      orders: mockOrders,
      updateOrderStatus: vi.fn(),
    });

    render(<OrderQueue />);
    
    expect(screen.getByText('Production Queue')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Position: 1')).toBeInTheDocument();
  });

  it('renders in-progress order correctly', () => {
    // Set the mock to return an order with in-progress status
    const mockOrders = [
      {
        id: '1',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        items: [
          { id: '1', name: 'Item 1', quantity: 2, productionTimePerUnit: 10 },
        ],
        status: 'in-progress',
        totalProductionTime: 20,
        estimatedCompletionDate: new Date(),
        queuePosition: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(useOrder).mockReturnValueOnce({
      loading: false,
      orders: mockOrders,
      updateOrderStatus: vi.fn(),
    });

    render(<OrderQueue />);
    
    expect(screen.getByText('Production Queue')).toBeInTheDocument();
    expect(screen.getByText('Currently In Progress')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('triggers updateOrderStatus when "Start Next Order" button is clicked', async () => {
    const updateOrderStatus = vi.fn();
    const mockOrders = [
      {
        id: 'order-1',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        items: [
          { id: '1', name: 'Item 1', quantity: 2, productionTimePerUnit: 10 },
        ],
        status: 'pending',
        totalProductionTime: 20,
        estimatedCompletionDate: new Date(),
        queuePosition: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(useOrder).mockReturnValueOnce({
      loading: false,
      orders: mockOrders,
      updateOrderStatus,
    });

    render(<OrderQueue />);
    
    const startButton = screen.getByText('Start Next Order');
    expect(startButton).toBeInTheDocument();
    
    const user = userEvent.setup();
    await user.click(startButton);
    
    expect(updateOrderStatus).toHaveBeenCalledWith('order-1', 'in-progress');
  });
});
