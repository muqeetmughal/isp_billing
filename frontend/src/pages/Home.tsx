
import { useFrappeAuth } from "frappe-react-sdk";
import axios from "axios";
import { useEffect, useState } from "react";
import CounterCard from "../component/Counter";
import type { Invoice, SubscriptionType, SupportTicketData, Customer } from "../Data/globle";



const Home = () => {
  const { currentUser } = useFrappeAuth();
  const [customerDetails, setCustomerDetails] = useState<Customer | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubscriptionType[]>([]);
  const [issues, setIssues] = useState<SupportTicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  

  useEffect(() => {
    if (!currentUser) return;

    const fetchCustomerDetails = async () => {
      try {
        const res = await axios.get(
          "/api/method/isp_billing.api.subscription.get_customer",
          { params: { email: currentUser } }
        );
        if (res.data.message && res.data.message.length > 0) {
          setCustomerDetails(res.data.message[0]);
        }
      } catch (error) {
        console.error("Error fetching customer details:", error);
      }
    };

    const fetchSubscriptions = async () => {
      try {
        const response = await axios.get(
          "/api/method/isp_billing.api.subscription.get_subscription_details",
          { params: { email: currentUser } }
        );
        setSubscriptions(response.data.message || []);
      } catch (error) {
        console.error("Error fetching subscriptions:", error);
      }
    };

    const fetchIssues = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          "/api/method/isp_billing.api.issue.get_issues",
          { params: { email: currentUser } }
        );
        setIssues(response.data.message || []);
      } catch (error) {
        console.error("Error fetching issues:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          "/api/method/isp_billing.api.sales_invoice.get_sales_invoice",
          { params: { email: currentUser } }
        );
        setInvoices(response.data.message || []);
      } catch (error) {
        console.error("Failed to fetch invoices:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerDetails();
    fetchSubscriptions();
    fetchIssues();
    fetchInvoices();
  }, [currentUser]);

  return (
    <>
      <div className="bg-white shadow-md rounded-lg p-6 ">
        <h1 className="text-3xl font-semibold">
          Welcome{" "}
          <span className="text-[#7d4fff] font-bold">
            {customerDetails?.customer_name || "User"}
          </span>{" "}
          to the CLI Secure Portal
        </h1>
        <p className="text-gray-600 mb-4">
          Manage your subscriptions, support tickets, and invoices with ease.
        </p>
      </div>

      

      {/* Stats Cards */}
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex flex-col items-center p-6">
        <div className="backdrop-blur-md bg-white/30 border border-white/40 rounded-2xl shadow-2xl p-10 w-full animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CounterCard
              title="Subscriptions"
              subtitle="View and manage your active plans."
              color="text-indigo-600"
              icon="💳"
              target={subscriptions.length}
            />
            <CounterCard
              title="Support Tickets"
              subtitle="Raise and track your support issues."
              color="text-purple-600"
              icon="🎫"
              target={issues.length}
            />
            <CounterCard
              title="Billing History"
              subtitle="Access your invoices and payment logs."
              color="text-pink-600"
              icon="📊"
              target={invoices.length}
            />
          </div>
          {/* Customer Details */}

      {customerDetails && (
  <div className="bg-white shadow-lg rounded-lg p-6 my-6">
    <h2 className="text-2xl font-bold mb-4">Your Profile</h2>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-gray-700">
      <div className="flex">
        <span className="font-semibold w-40">Portal Login:</span>
        <span>{customerDetails.custom_portal_login}</span>
      </div>
      <div className="flex">
        <span className="font-semibold w-40">Portal Password:</span>
        <span>{customerDetails.custom_portal_password}</span>
      </div>
      <div className="flex">
        <span className="font-semibold w-40">Email:</span>
        <span>{customerDetails.custom_email}</span>
      </div>
      <div className="flex">
        <span className="font-semibold w-40">Mobile:</span>
        <span>{customerDetails.custom_mobile_no}</span>
      </div>
      <div className="flex">
        <span className="font-semibold w-40">Billing Email:</span>
        <span>{customerDetails.custom_billing_email}</span>
      </div>
      <div className="flex">
        <span className="font-semibold w-40">Partner:</span>
        <span>{customerDetails.custom_partner}</span>
      </div>
      <div className="flex">
        <span className="font-semibold w-40">Billing Type:</span>
        <span>{customerDetails.custom_billing_type}</span>
      </div>
      <div className="flex">
        <span className="font-semibold w-40">Company:</span>
        <span>{customerDetails.custom_company}</span>
      </div>
      <div className="flex">
        <span className="font-semibold w-40">Reseller:</span>
        <span>{customerDetails.custom_reseller}</span>
      </div>
      <div className="flex">
        <span className="font-semibold w-40">Agent:</span>
        <span>{customerDetails.custom_agent}</span>
      </div>
      <div className="flex">
        <span className="font-semibold w-40">Date of Birth:</span>
        <span>{customerDetails.custom_date_of_birth}</span>
      </div>
      <div className="flex">
        <span className="font-semibold w-40">Hotspot MAC:</span>
        <span>{customerDetails.custom_hotspot_mac}</span>
      </div>
      <div className="flex">
        <span className="font-semibold w-40">Identification:</span>
        <span>{customerDetails.custom_identification}</span>
      </div>
      <div className="flex">
        <span className="font-semibold w-40">Location:</span>
        <span>{customerDetails.custom_location}</span>
      </div>
      <div className="flex">
        <span className="font-semibold w-40">Street:</span>
        <span>{customerDetails.custom_street}</span>
      </div>
      <div className="flex">
        <span className="font-semibold w-40">City:</span>
        <span>{customerDetails.custom_city}</span>
      </div>
      <div className="flex">
        <span className="font-semibold w-40">Zip Code:</span>
        <span>{customerDetails.custom_zip_code}</span>
      </div>
      <div className="flex">
        <span className="font-semibold w-40">Date Added:</span>
        <span>{customerDetails.custom_date_added}</span>
      </div>
    </div>
  </div>
)}

        </div>
      </div>

      
    </>
  );
};

export default Home;
