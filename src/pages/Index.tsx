
import OrderCalculator from "@/components/OrderCalculator";
import OrderQueue from "@/components/OrderQueue";
import Navbar from "@/components/Navbar";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <OrderCalculator />
          </div>
          {!isMobile && (
            <div>
              <div className="space-y-6">
                <OrderQueue />
              </div>
            </div>
          )}
          {isMobile && (
            <div>
              <OrderQueue />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
