
import Navbar from "@/components/Navbar";
import ProductionCalendar from "@/components/ProductionCalendar";

const CalendarPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-12">
        <h1 className="text-3xl font-bold mb-6">Production Calendar</h1>
        <ProductionCalendar />
      </div>
    </div>
  );
};

export default CalendarPage;
