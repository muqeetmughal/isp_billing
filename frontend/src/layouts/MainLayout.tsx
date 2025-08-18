import {
  CreditCard,
  Bell,
  Activity,
  BadgeCheck,
  Ticket,
  LogOut,
  Loader2,
} from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useFrappeAuth } from "frappe-react-sdk";
import { useState } from "react";
import cliSecureLogo from "../assets/clisecure logo.png";


const CustomerPortal = () => {
  const auth = useFrappeAuth();
  const location = useLocation();
  const activeTab = location.pathname.split("/")[1];

  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await auth.logout();
    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className=" ">
                  <img
                  src={cliSecureLogo}
                  alt="CLI Secure Logo"
                  className="w-20 h-14 object-contain"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>

              <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">
                <div className="w-8 h-8 bg-gradient-to-br from-[#7d4fff] to-[#6c38fd] rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">JS</span>
                </div>
                <span className="text-sm font-medium text-gray-700">{auth.currentUser}</span>
                <button
                  onClick={handleLogout}
                  disabled={logoutLoading}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer disabled:opacity-50"
                >
                  {logoutLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  ) : (
                    <LogOut className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 px-6">
        <div className="flex space-x-8">
          {[
            { id: "dashboard", label: "Dashboard", icon: Activity },
            { id: "invoices", label: "Invoices", icon: CreditCard },
            { id: "subscription", label: "Subscription", icon: BadgeCheck },
            { id: "support_tickets", label: "Support Tickets", icon: Ticket },
          ].map((tab) => (
            <Link
              to={`/${tab.id}`}
              key={tab.id}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab.includes(tab.id)
                  ? "border-[#7d4fff] text-[#7d4fff]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      <Outlet />
    </div>
  );
};

export default CustomerPortal;
