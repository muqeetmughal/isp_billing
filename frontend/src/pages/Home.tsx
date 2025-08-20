import { useFrappeAuth } from "frappe-react-sdk";
import axios from "axios";
import { useEffect, useState } from "react";
import CounterCard from "../component/Counter";
import type { Invoice, SubscriptionType, SupportTicketData } from "../Data/globle";

const Home = () => {
  const { currentUser } = useFrappeAuth();
  const [customerName, setCustomerName] = useState<string>("");
  const [subscriptions, setSubscriptions] = useState<SubscriptionType[]>([]);
  const [issues, setIssues] = useState<SupportTicketData[]>([]);
  const [loading, setLoading] = useState(true);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  

  useEffect(() => {
    const fetchCustomerName = async () => {
      const customerRes = await axios.get(
        "/api/method/isp_billing.api.subscription.get_customer_name_by_email",
        { params: { email: currentUser } }
      );
      const customerName = customerRes.data.message;
      setCustomerName(customerName);
    };
    fetchCustomerName();

    const fetchSubscriptions = async () => {
      if (!currentUser) return;
      try {
        const response = await axios.get(
          "/api/method/isp_billing.api.subscription.get_subscription_details",
          { params: { email: currentUser } }
        );
        if (response.data.message && response.data.message.length > 0) {
          setSubscriptions(response.data.message);
        }
      } catch (error) {
        console.error("Error fetching subscriptions:", error);
      }
    };
    fetchSubscriptions();

    const fetchIssues = async () => {
      if (!currentUser) return;
      try {
        setLoading(true);
        const response = await axios.get(
          "/api/method/isp_billing.api.issue.get_issues",
          {
            params: { email: currentUser },
          }
        );
        setIssues(response.data.message || []);
      } catch (error) {
        console.error("Error fetching issues:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchIssues();
      const fetchInvoices = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        const response = await axios.get(
          "/api/method/isp_billing.api.sales_invoice.get_sales_invoice",
          {
            params: { email: currentUser },
          }
        );
        const fetchedInvoices: Invoice[] = response.data.message;
        setInvoices(fetchedInvoices);
        setFilteredInvoices(fetchedInvoices);
      } catch (error) {
        console.error("Failed to fetch invoices:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [currentUser]);

  return (
    <>
      <div className="bg-white shadow-md rounded-lg p-6 ">
        <h1 className="text-3xl font-semibold">
          Welcome{" "}
          <span className="text-[#7d4fff] font-bold">{customerName}</span> to
          the CLI Secure Portal
        </h1>
        <p className=" text-gray-600 mb-4">
          Manage your subscriptions, support tickets, and invoices with ease.
        </p>
      </div>
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
              target={issues.length} // Replace with API data
            />
            <CounterCard
              title="Billing History"
              subtitle="Access your invoices and payment logs."
              color="text-pink-600"
              icon="📊"
              target={invoices.length} // Replace with API data
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
