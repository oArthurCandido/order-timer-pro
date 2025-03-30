
import OrderManagement from "@/components/OrderManagement";
import Navbar from "@/components/Navbar";

const OrderManagementPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-12">
        <h1 className="text-3xl font-bold mb-6">Order Management</h1>
        <OrderManagement />
      </div>
    </div>
  );
};

export default OrderManagementPage;
