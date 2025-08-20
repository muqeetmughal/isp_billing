import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Building,
  CreditCard,
  Ticket,
  FileText,
  LogOut,
  Loader2,
  Bell,
} from "lucide-react";
import { useFrappeAuth } from "frappe-react-sdk";
import cliSecureLogo from "../assets/clisecure logo.png";

// Using fetch API instead of axios
// Removed frappe-react-sdk dependency

interface Customer {
  name: string;
  customer_name: string;
  custom_email?: string;
  custom_mobile_no?: string;
  custom_billing_email?: string;
  custom_partner?: string;
  custom_billing_type?: string;
  custom_city?: string;
  custom_portal_login?: string;
  custom_portal_password?: string;
  custom_location?: string;
  custom_date_of_birth?: string;
  custom_date_added?: string;
  custom_street?: string;
  custom_zip_code?: string;
  custom_reseller?: string;
  custom_company?: string;
  custom_agent?: string;
  custom_identification?: string;
  custom_hotspot_mac?: string;
}

interface Subscription {
  name: string;
  party_type: string;
  party: string;
  status: string;
  plans: Array<{
    plan: string;
    qty: number;
  }>;
}

interface Invoice {
  name: string;
  customer: string;
  company: string;
  currency: string;
  grand_total: number;
  posting_date: string;
  status: string;
}

interface Issue {
  name: string;
  customer: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  custom_group?: string;
  custom_type?: string;
  custom_assigned_to?: string;
  custom_watchers?: string;
}

const CustomerDetailView = ({
  customer,
  onBack,
}: {
  customer: Customer;
  onBack: () => void;
}) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchCustomerDetails = async () => {
      if (!customer.custom_email) return;

      try {
        setLoading(true);

        // Fetch subscriptions, invoices, and issues in parallel
        const [subscriptionsRes, invoicesRes, issuesRes] = await Promise.all([
          fetch(
            `/api/method/isp_billing.api.subscription.get_subscription_details?email=${customer.custom_email}`
          ),
          fetch(
            `/api/method/isp_billing.api.sales_invoice.get_sales_invoice?email=${customer.custom_email}`
          ),
          fetch(
            `/api/method/isp_billing.api.issue.get_issues?email=${customer.custom_email}`
          ),
        ]);

        const subscriptionsData = await subscriptionsRes.json();
        const invoicesData = await invoicesRes.json();
        const issuesData = await issuesRes.json();

        setSubscriptions(subscriptionsData.message || []);
        setInvoices(invoicesData.message || []);
        setIssues(issuesData.message || []);
      } catch (error) {
        console.error("Failed to fetch customer details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerDetails();
  }, [customer.custom_email]);

  const getStatusBadge = (
    status: string,
    type: "subscription" | "invoice" | "issue"
  ) => {
    let colorClass = "bg-gray-100 text-gray-800";

    if (type === "subscription") {
      if (status === "Active") colorClass = "bg-green-100 text-green-800";
      else if (status === "Cancelled") colorClass = "bg-red-100 text-red-800";
    } else if (type === "invoice") {
      if (status === "Paid") colorClass = "bg-green-100 text-green-800";
      else if (status === "Unpaid") colorClass = "bg-red-100 text-red-800";
      else if (status === "Overdue")
        colorClass = "bg-orange-100 text-orange-800";
    } else if (type === "issue") {
      if (status === "Open") colorClass = "bg-blue-100 text-blue-800";
      else if (status === "Closed") colorClass = "bg-gray-100 text-gray-800";
      else if (status === "Resolved")
        colorClass = "bg-green-100 text-green-800";
    }

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}
      >
        {status}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    let colorClass = "bg-gray-100 text-gray-800";

    if (priority === "High") colorClass = "bg-red-100 text-red-800";
    else if (priority === "Medium")
      colorClass = "bg-orange-100 text-orange-800";
    else if (priority === "Low") colorClass = "bg-green-100 text-green-800";

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}
      >
        {priority}
      </span>
    );
  };
  const auth = useFrappeAuth();
  // const activeTab = location.pathname.split("/")[1];

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
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 h-28">
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
                <span className="text-sm font-medium text-gray-700">
                  {auth.currentUser}
                </span>
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
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Dashboard
            </button>
            <div className="h-6 w-px bg-gray-300" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {customer.customer_name}
              </h1>
              <p className="text-gray-600">{customer.custom_email}</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-6">
            <nav className="flex space-x-8">
              {[
                { id: "overview", label: "Overview", icon: User },
                {
                  id: "subscriptions",
                  label: "Subscriptions",
                  icon: CreditCard,
                },
                { id: "invoices", label: "Invoices", icon: FileText },
                { id: "issues", label: "Support Tickets", icon: Ticket },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-[#7d4fff] text-[#7d4fff]"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center mt-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7d4fff] mx-auto mb-2"></div>
              <p className="text-gray-500">Loading customer details...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Personal Information */}
                  <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personal Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {customer.custom_email || "-"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {customer.custom_mobile_no || "-"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          DOB: {customer.custom_date_of_birth || "-"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {customer.custom_company || "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Address Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Street:</strong> {customer.custom_street || "-"}
                      </p>
                      <p>
                        <strong>City:</strong> {customer.custom_city || "-"}
                      </p>
                      <p>
                        <strong>ZIP Code:</strong>{" "}
                        {customer.custom_zip_code || "-"}
                      </p>
                      <p>
                        <strong>Location:</strong>{" "}
                        {customer.custom_location || "-"}
                      </p>
                    </div>
                  </div>

                  {/* Account Details */}
                  <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Account Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Billing Type:</strong>{" "}
                        {customer.custom_billing_type || "-"}
                      </p>
                      <p>
                        <strong>Partner:</strong>{" "}
                        {customer.custom_partner || "-"}
                      </p>
                      <p>
                        <strong>Agent:</strong> {customer.custom_agent || "-"}
                      </p>
                      <p>
                        <strong>Reseller:</strong>{" "}
                        {customer.custom_reseller || "-"}
                      </p>
                      <p>
                        <strong>Date Added:</strong>{" "}
                        {customer.custom_date_added || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <p className="text-sm font-medium text-gray-600">
                      Active Subscriptions
                    </p>
                    <p className="text-2xl font-bold text-green-500">
                      {
                        subscriptions.filter((s) => s.status === "Active")
                          .length
                      }
                    </p>
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <p className="text-sm font-medium text-gray-600">
                      Total Invoices
                    </p>
                    <p className="text-2xl font-bold text-[#7d4fff]">
                      {invoices.length}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <p className="text-sm font-medium text-gray-600">
                      Open Issues
                    </p>
                    <p className="text-2xl font-bold text-red-500">
                      {issues.filter((i) => i.status === "Open").length}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Subscriptions Tab */}
            {activeTab === "subscriptions" && (
              <div className="bg-white rounded-lg shadow-md border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Subscriptions ({subscriptions.length})
                  </h2>
                </div>
                {subscriptions.length === 0 ? (
                  <div className="text-center py-12">
                    <CreditCard className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="text-gray-500">No subscriptions found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subscription ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Plans
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {subscriptions.map((subscription) => (
                          <tr key={subscription.name}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {subscription.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(
                                subscription.status,
                                "subscription"
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                {subscription.plans.map((plan, index) => (
                                  <div key={index} className="text-sm">
                                    {plan.plan} (Qty: {plan.qty})
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Invoices Tab */}
            {activeTab === "invoices" && (
              <div className="bg-white rounded-lg shadow-md border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Invoices ({invoices.length})
                  </h2>
                </div>
                {invoices.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="text-gray-500">No invoices found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Invoice ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Company
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {invoices.map((invoice) => (
                          <tr key={invoice.name}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {invoice.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {invoice.posting_date}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {invoice.currency}{" "}
                              {invoice.grand_total.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(invoice.status, "invoice")}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {invoice.company}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Issues Tab */}
            {/* {activeTab === "issues" && (
              <div className="bg-white rounded-lg shadow-md border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Support Tickets ({issues.length})
                  </h2>
                </div>
                {issues.length === 0 ? (
                  <div className="text-center py-12">
                    <Ticket className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="text-gray-500">No support tickets found</p>
                  </div>
                ) : (
                  <div className="space-y-4 p-6">
                    {issues.map((issue) => (
                      <div key={issue.name} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-sm font-medium text-gray-900">{issue.subject}</h3>
                              {getStatusBadge(issue.status, 'issue')}
                              {getPriorityBadge(issue.priority)}
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{issue.description}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>ID: {issue.name}</span>
                              {issue.custom_type && <span>Type: {issue.custom_type}</span>}
                              {issue.custom_group && <span>Group: {issue.custom_group}</span>}
                              {issue.custom_assigned_to && <span>Assigned: {issue.custom_assigned_to}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )} */}

            {activeTab === "issues" && (
              <div className="bg-white rounded-lg shadow-md border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Support Tickets ({issues.length})
                  </h2>
                </div>

                {issues.length === 0 ? (
                  <div className="text-center py-12">
                    <Ticket className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="text-gray-500">No support tickets found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Subject
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Priority
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Group
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Assigned To
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Description
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {issues.map((issue) => (
                          <tr key={issue.name} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {issue.name}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {issue.subject}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {getStatusBadge(issue.status, "issue")}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {getPriorityBadge(issue.priority)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {issue.custom_type || "-"}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {issue.custom_group || "-"}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {issue.custom_assigned_to || "-"}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                              {issue.description}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "/api/method/isp_billing.api.subscription.get_customer"
        );
        const data = await response.json();
        setCustomers(data.message || []);
      } catch (error) {
        console.error("Failed to fetch customers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.customer_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      customer.custom_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.custom_partner?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || customer.custom_billing_type === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(
    (c) => c.custom_billing_type === "Recurring"
  ).length;
  const inactiveCustomers = customers.filter(
    (c) => c.custom_billing_type === "Prepaid (Custom)"
  ).length;

  if (selectedCustomer) {
    return (
      <CustomerDetailView
        customer={selectedCustomer}
        onBack={() => setSelectedCustomer(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">Manage and view all your customers</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <p className="text-sm font-medium text-gray-600">Total Customers</p>
            <p className="text-2xl font-bold text-gray-900">{totalCustomers}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <p className="text-sm font-medium text-gray-600">
              Active Customers
            </p>
            <p className="text-2xl font-bold text-green-500">
              {activeCustomers}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <p className="text-sm font-medium text-gray-600">
              Inactive Customers
            </p>
            <p className="text-2xl font-bold text-red-500">
              {inactiveCustomers}
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search customers..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7d4fff]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7d4fff]"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Recurring">Recurring</option>
                <option value="Prepaid (Custom)">Prepaid (Custom)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              All Customers ({filteredCustomers.length})
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7d4fff] mx-auto mb-2"></div>
                <p className="text-gray-500">Loading customers...</p>
              </div>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto text-gray-400" />
              <p className="text-gray-500">No customers found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mobile
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Partner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Billing Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      City
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.name} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.customer_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {customer.custom_email || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {customer.custom_mobile_no || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {customer.custom_partner || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            customer.custom_billing_type === "Recurring"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {customer.custom_billing_type || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {customer.custom_city || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedCustomer(customer)}
                          className="text-[#7d4fff] hover:text-blue-900 text-sm font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
