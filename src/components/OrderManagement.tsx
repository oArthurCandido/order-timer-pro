import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useOrder } from "@/contexts/OrderContext";
import { Badge } from "@/components/ui/badge";
import { Order, OrderStatus } from "@/types/order";
import { formatDuration } from "@/lib/calculateProductionTime";
import { format } from "date-fns";
import {
  CheckCircle,
  Clock,
  Mail,
  MoreHorizontal,
  MoveDown,
  MoveUp,
  Pause,
  Play,
  Trash,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const OrderManagement = () => {
  const { orders, updateOrderStatus, updateOrderPosition, deleteOrder } = useOrder();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState<boolean>(false);
  const [emailOrder, setEmailOrder] = useState<Order | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const isMobile = useIsMobile();

  const sortedOrders = [...orders].sort((a, b) => {
    // First by status - pending and in-progress first
    const statusOrder: Record<OrderStatus, number> = {
      "in-progress": 0,
      "pending": 1,
      "completed": 2,
      "cancelled": 3,
    };
    
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    
    // Then by queue position for pending and in-progress
    if (
      (a.status === "pending" || a.status === "in-progress") &&
      (b.status === "pending" || b.status === "in-progress")
    ) {
      return a.queuePosition - b.queuePosition;
    }
    
    // Otherwise by creation date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleStatusChange = (id: string, newStatus: OrderStatus) => {
    updateOrderStatus(id, newStatus);
  };

  const handleMoveOrder = (id: string, direction: "up" | "down") => {
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    
    const newPosition = direction === "up" 
      ? Math.max(1, order.queuePosition - 1)
      : order.queuePosition + 1;
      
    updateOrderPosition(id, newPosition);
  };

  const handleDelete = (id: string) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = () => {
    if (confirmDeleteId) {
      deleteOrder(confirmDeleteId);
      setConfirmDeleteId(null);
    }
  };

  const prepareEmail = (order: Order) => {
    setEmailOrder(order);
    setEmailSubject(`Order ${order.id.substring(6)} Completion`);
    
    // Create a default email body
    const itemsList = order.items
      .map((item) => `${item.quantity}x ${item.name}`)
      .join(", ");
      
    setEmailBody(
      `Dear ${order.customerName},\n\nWe're pleased to inform you that your order (${itemsList}) has been completed and is ready for pickup/delivery.\n\nThank you for your business!\n\nBest regards,\nOrderTimer Team`
    );
    
    setSendingEmail(true);
  };

  const sendEmail = () => {
    // In a real application, this would connect to an email API
    // For now, we'll just show a toast message
    toast.success(`Email sent to ${emailOrder?.customerEmail}`);
    setSendingEmail(false);
    setEmailOrder(null);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-200">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case "in-progress":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-200">
            <Play className="mr-1 h-3 w-3" />
            In Progress
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-200">
            <CheckCircle className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-200">
            <X className="mr-1 h-3 w-3" />
            Cancelled
          </Badge>
        );
    }
  };

  const MobileOrderCard = ({ order }: { order: Order }) => (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{order.customerName}</CardTitle>
          {getStatusBadge(order.status)}
        </div>
        <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-2 text-sm mb-2">
          <div>
            <p className="font-medium text-muted-foreground">Items:</p>
            {order.items.map((item) => (
              <p key={item.id} className="text-foreground">
                {item.quantity}x {item.name}
              </p>
            ))}
          </div>
          <div>
            <p className="font-medium text-muted-foreground">Production Time:</p>
            <p className="text-foreground">{formatDuration(order.totalProductionTime)}</p>
            
            <p className="font-medium text-muted-foreground mt-1">Est. Completion:</p>
            <p className="text-foreground">{format(new Date(order.estimatedCompletionDate), "MMM d, h:mm a")}</p>
            
            {(order.status === "pending" || order.status === "in-progress") && (
              <>
                <p className="font-medium text-muted-foreground mt-1">Queue Position:</p>
                <p className="text-foreground">{order.queuePosition}</p>
              </>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <div className="w-full">
          <div className="flex space-x-2 justify-end">
            {order.status === "pending" && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleStatusChange(order.id, "in-progress")}
              >
                <Play className="h-3.5 w-3.5 mr-1" />
                Start
              </Button>
            )}
            
            {order.status === "in-progress" && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleStatusChange(order.id, "completed")}
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                Complete
              </Button>
            )}
            
            {order.status === "completed" && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => prepareEmail(order)}
              >
                <Mail className="h-3.5 w-3.5 mr-1" />
                Email
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {order.status === "pending" && (
                  <>
                    <DropdownMenuItem 
                      onClick={() => handleMoveOrder(order.id, "up")}
                      disabled={order.queuePosition === 1}
                    >
                      <MoveUp className="mr-2 h-4 w-4" />
                      Move Up in Queue
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleMoveOrder(order.id, "down")}
                    >
                      <MoveDown className="mr-2 h-4 w-4" />
                      Move Down in Queue
                    </DropdownMenuItem>
                  </>
                )}
                
                {order.status === "in-progress" && (
                  <DropdownMenuItem onClick={() => handleStatusChange(order.id, "pending")}>
                    <Pause className="mr-2 h-4 w-4" />
                    Pause Production
                  </DropdownMenuItem>
                )}
                
                {order.status !== "cancelled" && (
                  <DropdownMenuItem onClick={() => handleStatusChange(order.id, "cancelled")}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel Order
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuItem 
                  onClick={() => handleDelete(order.id)}
                  className="text-red-500 focus:text-red-500"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete Order
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardFooter>
    </Card>
  );

  return (
    <>
      {isMobile ? (
        <div className="space-y-4">
          {sortedOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No orders found
            </div>
          ) : (
            sortedOrders.map((order) => (
              <MobileOrderCard key={order.id} order={order} />
            ))
          )}
        </div>
      ) : (
        <div className="bg-background rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Production Time</TableHead>
                <TableHead>Est. Completion</TableHead>
                <TableHead>Queue</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                sortedOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.customerName}</div>
                        <div className="text-xs text-muted-foreground">{order.customerEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {order.items.map((item) => (
                          <div key={item.id}>
                            {item.quantity}x {item.name}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{formatDuration(order.totalProductionTime)}</TableCell>
                    <TableCell>
                      {format(new Date(order.estimatedCompletionDate), "MMM d, h:mm a")}
                    </TableCell>
                    <TableCell>
                      {(order.status === "pending" || order.status === "in-progress") ? (
                        <span className="font-medium">{order.queuePosition}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {order.status === "pending" && (
                            <>
                              <DropdownMenuItem onClick={() => handleStatusChange(order.id, "in-progress")}>
                                <Play className="mr-2 h-4 w-4" />
                                Start Production
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleMoveOrder(order.id, "up")}
                                disabled={order.queuePosition === 1}
                              >
                                <MoveUp className="mr-2 h-4 w-4" />
                                Move Up in Queue
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleMoveOrder(order.id, "down")}
                              >
                                <MoveDown className="mr-2 h-4 w-4" />
                                Move Down in Queue
                              </DropdownMenuItem>
                            </>
                          )}
                          
                          {order.status === "in-progress" && (
                            <>
                              <DropdownMenuItem onClick={() => handleStatusChange(order.id, "completed")}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark as Completed
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(order.id, "pending")}>
                                <Pause className="mr-2 h-4 w-4" />
                                Pause Production
                              </DropdownMenuItem>
                            </>
                          )}
                          
                          {order.status === "completed" && (
                            <DropdownMenuItem onClick={() => prepareEmail(order)}>
                              <Mail className="mr-2 h-4 w-4" />
                              Send Completion Email
                            </DropdownMenuItem>
                          )}
                          
                          {order.status !== "cancelled" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(order.id, "cancelled")}>
                              <X className="mr-2 h-4 w-4" />
                              Cancel Order
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuItem 
                            onClick={() => handleDelete(order.id)}
                            className="text-red-500 focus:text-red-500"
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete Order
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!confirmDeleteId} onOpenChange={() => setConfirmDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this order? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={sendingEmail} onOpenChange={() => setSendingEmail(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Completion Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium mb-1">To:</div>
              <div className="text-sm">{emailOrder?.customerEmail}</div>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Subject:</div>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Message:</div>
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="w-full min-h-[150px] p-2 rounded-md border border-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendingEmail(false)}>
              Cancel
            </Button>
            <Button onClick={sendEmail}>Send Email</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrderManagement;
