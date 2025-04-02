
import { useAuth } from "../contexts/AuthContext";
import Sidebar from "../components/Sidebar";
import ComposePost from "../components/ComposePost";
import Widgets from "../components/Widgets";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const ComposePage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl font-bold text-gradient animate-pulse">BancaX</div>
      </div>
    );
  }

  // If not logged in, redirect to home
  if (!user) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen max-w-7xl mx-auto grid grid-cols-12 gap-4 px-4">
      <div className="hidden md:block md:col-span-3 lg:col-span-2">
        <Sidebar />
      </div>
      <main className="col-span-12 md:col-span-9 lg:col-span-7 pt-4">
        <div className="flex items-center mb-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="rounded-full mr-4"
          >
            <X className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">New Post</h1>
        </div>
        <ComposePost onSuccess={() => navigate("/")} />
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

export default ComposePage;
