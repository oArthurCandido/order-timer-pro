
import Navbar from "@/components/Navbar";
import ProductionSettings from "@/components/ProductionSettings";

const Settings = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-12">
        <h1 className="text-3xl font-bold mb-6">Configurações</h1>
        <ProductionSettings />
      </div>
    </div>
  );
};

export default Settings;
