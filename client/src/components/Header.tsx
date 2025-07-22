import { Heart, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";

interface HeaderProps {
  user?: {
    name: string;
    role: string;
    profileImage?: string;
  };
}

export default function Header({ user }: HeaderProps) {
  const [location] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/" },
    { name: "Simulator", href: "/simulator" },
    { name: "Analysis", href: "/xray-analysis" },
    { name: "Monitor", href: "/misinformation-monitor" },
    { name: "Chatbot", href: "/triage-chatbot" }
  ];

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-600 text-white';
      case 'pediatrician':
        return 'bg-indigo-600 text-white';
      case 'medical_student':
        return 'bg-blue-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const formatRoleName = (role: string) => {
    return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <Heart className="h-6 w-6 text-red-400" />
              <h1 className="text-xl font-bold text-white">PediaSignal AI</h1>
            </Link>
            <nav className="hidden md:flex space-x-8 ml-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`transition-colors ${
                    location === item.href 
                      ? 'text-white border-b-2 border-blue-400' 
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <div className="hidden sm:flex items-center space-x-3">
                  <Badge className={`text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                    {formatRoleName(user.role)}
                  </Badge>
                  <span className="text-sm text-gray-300">{user.name}</span>
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.profileImage} alt="User profile" />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
