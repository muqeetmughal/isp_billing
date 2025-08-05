import {
  Calendar,
  DollarSign,
  Zap,
  CheckCircle,
  AlertTriangle,
  Router,
  Signal,
  RefreshCw,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { useFrappeAuth } from 'frappe-react-sdk';


type StatCardProps = {
  icon: React.ElementType;
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
};

const StatCard = ({ icon: Icon, title, value, subtitle, color = "blue" }: StatCardProps) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
    <div className="flex items-center space-x-4">
      <div
        className={`p-3 bg-gradient-to-br from-${color}-50 to-${color}-100 rounded-lg`}
      >
        <Icon className={`w-6 h-6 text-${color}-600`} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
    </div>
  </div>
);

const Home = () => {
     const auth = useFrappeAuth();
 
  const usageData = [
    { day: "Mon", download: 45, upload: 12 },
    { day: "Tue", download: 52, upload: 15 },
    { day: "Wed", download: 38, upload: 10 },
    { day: "Thu", download: 67, upload: 18 },
    { day: "Fri", download: 89, upload: 25 },
    { day: "Sat", download: 95, upload: 30 },
    { day: "Sun", download: 78, upload: 22 },
  ];
  const speedHistory = [
    { time: "00:00", speed: 195 },
    { time: "04:00", speed: 198 },
    { time: "08:00", speed: 187 },
    { time: "12:00", speed: 192 },
    { time: "16:00", speed: 189 },
    { time: "20:00", speed: 185 },
  ];

  const billingHistory = [
    {
      id: "INV-001",
      date: "2024-07-15",
      amount: "$89.99",
      status: "Paid",
      plan: "Premium 200 Mbps",
    },
    {
      id: "INV-002",
      date: "2024-06-15",
      amount: "$89.99",
      status: "Paid",
      plan: "Premium 200 Mbps",
    },
    {
      id: "INV-003",
      date: "2024-05-15",
      amount: "$89.99",
      status: "Paid",
      plan: "Premium 200 Mbps",
    },
    {
      id: "INV-004",
      date: "2024-04-15",
      amount: "$89.99",
      status: "Paid",
      plan: "Premium 200 Mbps",
    },
  ];

  const supportTickets = [
    {
      id: "TKT-001",
      subject: "Slow internet speed",
      status: "Open",
      created: "2024-07-28",
      priority: "High",
    },
    {
      id: "TKT-002",
      subject: "Billing inquiry",
      status: "Resolved",
      created: "2024-07-20",
      priority: "Medium",
    },
    {
      id: "TKT-003",
      subject: "Equipment replacement",
      status: "Closed",
      created: "2024-07-10",
      priority: "Low",
    },
  ];
  
  // Sample customer data
  const customerData = {
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main Street, Anytown, ST 12345',
    accountNumber: 'NET-2024-001234',
    plan: 'Premium 200 Mbps',
    status: 'Active',
    balance: 0,
    nextBilling: '2024-08-15',
    joinDate: '2022-03-15'
  };

 

  return (
    // <>
    //   {/* Main Content */}
      
    //   <main className="p-6">
    //     <div className="space-y-6">
    //       {/* Welcome Section */}
    //       <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
    //         <div className="flex items-center justify-between">
    //           <div>
    //             <h2 className="text-2xl font-bold mb-2">
    //               {/* Welcome back, {customerData.name.split(" ")[0]}! */}
    //               {auth.currentUser ? `Welcome back, ${auth.currentUser.split(" ")[0]}!` : "Welcome!"}
    //             </h2>
    //             <p className="text-blue-100">
    //               Your internet service is running smoothly
    //             </p>
    //           </div>
    //           <div className="text-right">
    //             <p className="text-blue-100 text-sm">Current Plan</p>
    //             <p className="text-xl font-semibold">{customerData.plan}</p>
    //           </div>
    //         </div>
    //       </div>

    //       {/* Quick Stats */}
    //       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    //         <StatCard
    //           icon={Zap}
    //           title="Current Speed"
    //           value="189 Mbps"
    //           subtitle="Download"
    //           color="green"
    //         />
    //         <StatCard
    //           icon={Signal}
    //           title="Connection Status"
    //           value="Excellent"
    //           subtitle="99.9% uptime"
    //           color="blue"
    //         />
    //         <StatCard
    //           icon={DollarSign}
    //           title="Account Balance"
    //           value={
    //             customerData.balance === 0 ? "Paid" : `$${customerData.balance}`
    //           }
    //           subtitle="Next bill: Aug 15"
    //           color={customerData.balance === 0 ? "green" : "red"}
    //         />
    //         <StatCard
    //           icon={Calendar}
    //           title="Service Since"
    //           value="2+ years"
    //           subtitle="Member since 2022"
    //           color="purple"
    //         />
    //       </div>

    //       {/* Current Speed & Usage */}
    //       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    //         {/* Speed Test */}
    //         <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
    //           <div className="flex items-center justify-between mb-6">
    //             <h3 className="text-lg font-semibold text-gray-900">
    //               Speed Test
    //             </h3>
    //             <button className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
    //               <RefreshCw className="w-4 h-4" />
    //               <span>Run Test</span>
    //             </button>
    //           </div>
    //           <div className="text-center py-8">
    //             <div className="relative w-32 h-32 mx-auto mb-4">
    //               <div className="w-32 h-32 rounded-full border-8 border-gray-200"></div>
    //               <div className="absolute inset-0 w-32 h-32 rounded-full border-8 border-green-500 border-t-transparent animate-spin"></div>
    //               <div className="absolute inset-0 flex items-center justify-center">
    //                 <div className="text-center">
    //                   <div className="text-2xl font-bold text-gray-900">
    //                     189
    //                   </div>
    //                   <div className="text-sm text-gray-500">Mbps</div>
    //                 </div>
    //               </div>
    //             </div>
    //             <p className="text-sm text-gray-600">
    //               Last tested: 2 hours ago
    //             </p>
    //           </div>
    //         </div>

    //         {/* Weekly Usage */}
    //         <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
    //           <h3 className="text-lg font-semibold text-gray-900 mb-6">
    //             Weekly Usage
    //           </h3>
    //           <ResponsiveContainer width="100%" height={200}>
    //             <BarChart data={usageData}>
    //               <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
    //               <XAxis dataKey="day" stroke="#6b7280" />
    //               <YAxis stroke="#6b7280" />
    //               <Tooltip
    //                 contentStyle={{
    //                   backgroundColor: "white",
    //                   border: "1px solid #e5e7eb",
    //                   borderRadius: "8px",
    //                   boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    //                 }}
    //               />
    //               <Bar
    //                 dataKey="download"
    //                 fill="#3b82f6"
    //                 radius={[4, 4, 0, 0]}
    //               />
    //               <Bar dataKey="upload" fill="#10b981" radius={[4, 4, 0, 0]} />
    //             </BarChart>
    //           </ResponsiveContainer>
    //           <div className="flex items-center justify-center space-x-6 mt-4">
    //             <div className="flex items-center space-x-2">
    //               <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
    //               <span className="text-sm text-gray-600">Download</span>
    //             </div>
    //             <div className="flex items-center space-x-2">
    //               <div className="w-3 h-3 bg-green-500 rounded-full"></div>
    //               <span className="text-sm text-gray-600">Upload</span>
    //             </div>
    //           </div>
    //         </div>
    //       </div>

    //       {/* Recent Activity */}
    //       <div className="bg-white rounded-xl shadow-sm border border-gray-100">
    //         <div className="p-6 border-b border-gray-100">
    //           <h3 className="text-lg font-semibold text-gray-900">
    //             Recent Activity
    //           </h3>
    //         </div>
    //         <div className="p-6">
    //           <div className="space-y-4">
    //             <div className="flex items-center space-x-3">
    //               <div className="p-2 bg-green-100 rounded-lg">
    //                 <CheckCircle className="w-4 h-4 text-green-600" />
    //               </div>
    //               <div className="flex-1">
    //                 <p className="text-sm font-medium text-gray-900">
    //                   Payment processed successfully
    //                 </p>
    //                 <p className="text-xs text-gray-500">
    //                   July 15, 2024 • $89.99
    //                 </p>
    //               </div>
    //             </div>
    //             <div className="flex items-center space-x-3">
    //               <div className="p-2 bg-blue-100 rounded-lg">
    //                 <Router className="w-4 h-4 text-blue-600" />
    //               </div>
    //               <div className="flex-1">
    //                 <p className="text-sm font-medium text-gray-900">
    //                   Equipment status check completed
    //                 </p>
    //                 <p className="text-xs text-gray-500">
    //                   July 10, 2024 • All systems normal
    //                 </p>
    //               </div>
    //             </div>
    //             <div className="flex items-center space-x-3">
    //               <div className="p-2 bg-yellow-100 rounded-lg">
    //                 <AlertTriangle className="w-4 h-4 text-yellow-600" />
    //               </div>
    //               <div className="flex-1">
    //                 <p className="text-sm font-medium text-gray-900">
    //                   Scheduled maintenance completed
    //                 </p>
    //                 <p className="text-xs text-gray-500">
    //                   July 5, 2024 • Service restored
    //                 </p>
    //               </div>
    //             </div>
    //           </div>
    //         </div>
    //       </div>
    //     </div>
    //   </main>

    // </>

    <>
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center p-6">
  <div className="backdrop-blur-md bg-white/30 border border-white/40 rounded-2xl shadow-2xl p-10 max-w-3xl w-full animate-fade-in">
    <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-center mb-4">
      Welcome to Your Customer Portal
    </h1>
    <p className="text-gray-800 text-center text-lg">
      Manage your subscriptions, support tickets, and more — all in one place.
    </p>

    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white bg-opacity-80 rounded-xl p-6 shadow-md hover:shadow-lg transition-all">
        <h2 className="text-xl font-semibold text-indigo-600">💳 Subscriptions</h2>
        <p className="text-gray-600 mt-2 text-sm">View and manage your active plans.</p>
      </div>
      <div className="bg-white bg-opacity-80 rounded-xl p-6 shadow-md hover:shadow-lg transition-all">
        <h2 className="text-xl font-semibold text-purple-600">🎫 Support Tickets</h2>
        <p className="text-gray-600 mt-2 text-sm">Raise and track your support issues.</p>
      </div>
      <div className="bg-white bg-opacity-80 rounded-xl p-6 shadow-md hover:shadow-lg transition-all">
        <h2 className="text-xl font-semibold text-pink-600">📊 Billing History</h2>
        <p className="text-gray-600 mt-2 text-sm">Access your invoices and payment logs.</p>
      </div>
    </div>
  </div>
</div>

    </>

  );
};

export default Home;
