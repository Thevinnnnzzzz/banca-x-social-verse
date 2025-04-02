
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "../contexts/AuthContext";
import {
  Home,
  Search,
  Bell,
  Mail,
  User,
  LogOut,
  PenSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const Sidebar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Search, label: "Explore", path: "/explore" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: Mail, label: "Messages", path: "/messages" },
    { icon: User, label: "Profile", path: `/profile/${user?.id}` }
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="h-screen sticky top-0 flex flex-col justify-between py-4 glass-card">
      <div className="space-y-6">
        <div className="flex items-center justify-center p-4">
          <Link to="/" className="text-2xl font-bold text-gradient">BancaX</Link>
        </div>

        <nav className="space-y-2 px-2">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path}>
              <Button 
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 px-4 py-6",
                  location.pathname === item.path ? "bg-white/10" : "hover:bg-white/5"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="hidden md:inline">{item.label}</span>
              </Button>
            </Link>
          ))}
          <Link to="/compose">
            <Button className="w-full mt-4 bg-bancax hover:bg-bancax/90 gap-3">
              <PenSquare className="h-5 w-5" />
              <span className="hidden md:inline">Post</span>
            </Button>
          </Link>
        </nav>
      </div>

      <div className="px-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-white/5">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">
                    {user?.email?.split('@')[0] || "User"}
                  </span>
                  <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                    {user?.email}
                  </span>
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={handleSignOut} className="text-red-500 focus:text-red-500">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default Sidebar;
