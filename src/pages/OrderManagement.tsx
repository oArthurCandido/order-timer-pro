
import OrderManagement from "@/components/OrderManagement";
import Navbar from "@/components/Navbar";
import OrderQueue from "@/components/OrderQueue";

const OrderManagementPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-12">
        <h1 className="text-3xl font-bold mb-6">Order Management</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <OrderManagement />
          </div>
          <div>
            <OrderQueue />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderManagementPage;
