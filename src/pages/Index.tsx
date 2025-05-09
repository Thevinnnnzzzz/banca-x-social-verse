
import { useAuth } from "../contexts/AuthContext";
import AuthForms from "../components/AuthForms";
import Sidebar from "../components/Sidebar";
import Feed from "../components/Feed";
import Widgets from "../components/Widgets";

const Index = () => {
  const { user, loading } = useAuth();

  // If auth is still loading, show a minimal loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl font-bold text-gradient animate-pulse">BancaX</div>
      </div>
    );
  }

  // If no user is logged in, show auth forms
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-md w-full">
          <h1 className="text-4xl font-bold text-center mb-8 text-gradient">BancaX</h1>
          <AuthForms />
        </div>
      </div>
    );
  }

  // If user is logged in, show the app
  return (
    <div className="min-h-screen max-w-7xl mx-auto grid grid-cols-12 gap-4 px-4">
      <div className="hidden md:block md:col-span-3 lg:col-span-2">
        <Sidebar />
      </div>
      <main className="col-span-12 md:col-span-9 lg:col-span-7 pt-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Home</h1>
        </div>
        <Feed />
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

export default Index;
