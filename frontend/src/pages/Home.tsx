import { useFrappeAuth } from "frappe-react-sdk";
import axios from "axios";
import { useEffect, useState } from "react";
import CounterCard from "../component/Counter";
import type {
  Invoice,
  SubscriptionType,
  SupportTicketData,
  Customer,
} from "../Data/globle";
import { Eye, EyeOff } from "lucide-react";

const Home = () => {
  const { currentUser } = useFrappeAuth();
  const [customerDetails, setCustomerDetails] = useState<Customer | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubscriptionType[]>([]);
  const [issues, setIssues] = useState<SupportTicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [plansCount, setPlansCount] = useState<number>(0);


  useEffect(() => {
    if (!currentUser) return;

    const fetchCustomerDetails = async () => {
      try {
        const res = await axios.get(
          "/api/method/isp_billing.api.customer.get_customer",
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
    setLoading(true);

    // Step 1: Get customer name by email
    const customerRes = await axios.get(
      "/api/method/isp_billing.api.customer.get_customer_name_by_email",
      { params: { email: currentUser } }
    );
    const customerName = customerRes.data.message;

    // Step 2: Get subscription details for that customer
    const response = await axios.get(
      "/api/method/isp_billing.api.subscription.get_new_subscription_details",
      { params: { subscriber: customerName } }
    );

    const subsData = response.data.message || [];

    // Step 3: Count total number of plans
    const totalPlans = subsData.reduce(
      (count: number, sub: any) => count + (sub.plans?.length || 0),
      0
    );

    setSubscriptions(subsData);
    setPlansCount(totalPlans); // <- new state for plan count
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
  } finally {
    setLoading(false);
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
              title="Subscription Plans"
              subtitle="View and manage your active plans."
              color="text-indigo-600"
              icon="💳"
              target={plansCount}
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

          {loading ? (
            <div className="flex justify-center mt-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7d4fff] mx-auto mb-2"></div>
                <p>Loading profile...</p>
              </div>
            </div>
          ) : (
            customerDetails && (
              <div className="bg-white shadow-lg rounded-lg p-6 my-6">
                <h2 className="text-2xl font-bold mb-4">Your Profile</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-gray-700">
                  <div className="flex">
                    <span className="font-semibold w-40">Portal Login:</span>
                    <span>{customerDetails.custom_portal_login}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-40">Email:</span>
                    <span>{customerDetails.custom_email}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold w-40">Portal Password:</span>
                    <span className="mr-2 w-28">
                      {showPassword
                        ? customerDetails?.custom_portal_password
                        : "•".repeat(
                            customerDetails?.custom_portal_password?.length || 0
                          )}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="text-gray-500 hover:text-gray-700 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
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
                    <span className="font-semibold w-40">Billing Type:</span>
                    <span>{customerDetails.custom_billing_type}</span>
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
                    <span className="font-semibold w-40">Company ID:</span>
                    <span>{customerDetails.custom_company_id}</span>
                  </div>            
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
};

export default Home;
