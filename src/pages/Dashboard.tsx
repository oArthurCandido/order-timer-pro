
import Dashboard from "@/components/Dashboard";
import Navbar from "@/components/Navbar";

const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-12">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <Dashboard />
      </div>
    </div>
  );
};

export default DashboardPage;
