
import { useAuth } from "../contexts/AuthContext";
import Sidebar from "../components/Sidebar";
import Widgets from "../components/Widgets";
import { Card, CardContent } from "@/components/ui/card";
import { Mail } from "lucide-react";

const MessagesPage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl font-bold text-gradient animate-pulse">BancaX</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-7xl mx-auto grid grid-cols-12 gap-4 px-4">
      <div className="hidden md:block md:col-span-3 lg:col-span-2">
        <Sidebar />
      </div>
      <main className="col-span-12 md:col-span-9 lg:col-span-7 pt-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Messages</h1>
        </div>
        
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-medium mb-2">Your inbox is empty</h2>
            <p className="text-muted-foreground">
              When you send or receive messages, they'll appear here
            </p>
          </CardContent>
        </Card>
      </main>
      <div className="hidden lg:block lg:col-span-3 pt-4">
        <Widgets />
      </div>
      
      {/* Mobile navigation - fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-background border-t border-white/10 z-50">
        <Sidebar />
      </div>
    </div>
  );
};

export default MessagesPage;
