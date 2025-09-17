import {
  CreditCard,
  Activity,
  BadgeCheck,
  Ticket,
  Loader2,
  Settings,
} from "lucide-react";
import axios from "axios";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useFrappeAuth } from "frappe-react-sdk";
import { useEffect, useState, useRef } from "react";
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

  const { currentUser } = useFrappeAuth();
  const [customerName, setCustomerName] = useState<string>("");

  useEffect(() => {
    const fetchCustomerName = async () => {
      const customerRes = await axios.get(
        "/api/method/isp_billing.api.customer.get_customer_name_by_email",
        { params: { email: currentUser } }
      );
      const customerName = customerRes.data.message;
      setCustomerName(customerName);
    };
    fetchCustomerName();
  }, [currentUser]);

  // State for dropdown & password modal
  const [showMenu, setShowMenu] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  // Ref for dropdown to detect outside clicks
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Change Password handler
  const handleChangePassword = async () => {
    if (!newPassword) return;
    try {
      const res = await axios.post("/api/method/isp_billing.api.customer.set_user_password", {
        email: currentUser,
        password: newPassword,
      });

      if (res.data.message?.success) {
        await auth.logout();
        await auth.login({ username: currentUser ?? "", password: newPassword });
      } else {
        alert(res.data.message?.msg || "Failed to change password");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong while changing password.");
    } finally {
      setShowChangePassword(false);
      setNewPassword("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div>
                  <img
                    src={cliSecureLogo}
                    alt="CLI Secure Logo"
                    className="w-20 h-14 object-contain"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">
                <div className="w-8 h-8 bg-gradient-to-br from-[#7d4fff] to-[#6c38fd] rounded-full flex items-center justify-center text-white font-bold">
                  {customerName
                    ? customerName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                    : currentUser
                        ?.split("@")[0]
                        .split(/[.\-_]/)
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {customerName || currentUser}
                </span>

                {/* Dropdown */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer disabled:opacity-50"
                  >
                    <Settings className="w-4 h-4 text-gray-400" />
                  </button>

                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setShowChangePassword(true);
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      >
                        Change Password
                      </button>
                      <button
                        onClick={handleLogout}
                        disabled={logoutLoading}
                        className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 cursor-pointer"
                      >
                        {logoutLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" />
                        ) : null}
                        Logout
                      </button>
                    </div>
                  )}
                </div>
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
            { id: "subscription", label: "Subscription", icon: BadgeCheck },
            { id: "invoices", label: "Invoices", icon: CreditCard },
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

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 flex items-center justify-center bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80">
            <h2 className="text-lg font-semibold mb-4">Change Password</h2>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border px-3 py-2 rounded mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowChangePassword(false)}
                className="px-4 py-2 text-sm text-gray-600 border rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                className="px-4 py-2 text-sm bg-[#7d4fff] text-white rounded cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerPortal;
