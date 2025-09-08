import { useEffect, useState } from "react";
import axios from "axios";
import { useFrappeAuth } from "frappe-react-sdk";
import type { SubscriptionType, SubscriptionPlan } from "../Data/globle";


const Subscription = () => {
  const { currentUser } = useFrappeAuth();
  const [subscriptions, setSubscriptions] = useState<SubscriptionType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  // Fetch current subscriptions
  useEffect(() => {
    const fetchSubscriptions = async () => {
      if (!currentUser) return;
      try {
        setLoading(true);
        const customerRes = await axios.get(
          "/api/method/isp_billing.api.customer.get_customer_name_by_email",
          { params: { email: currentUser } }
        );
        const customerName = customerRes.data.message;

        const response = await axios.get(
          "/api/method/isp_billing.api.subscription.get_new_subscription_details",
          { params: { subscriber: customerName } }
        );

        if (response.data.message && response.data.message.length > 0) {
          setSubscriptions(response.data.message);
        }
      } catch (error) {
        console.error("Error fetching subscriptions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSubscriptions();
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Subscription Dashboard
            </h1>
            <p className="text-gray-600">Manage your subscriptions</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center mt-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7d4fff] mx-auto mb-2"></div>
              <p className="text-gray-500">Processing...</p>
            </div>
          </div>
        ) : (
          // <>
          //   {subscriptions.length > 0 ? (
          //     <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          //       {subscriptions.map((sub) =>
          //         sub.plans.map((plan, index) => (
          //           <div
          //             key={`${sub.name}-${index}`}
          //             className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition"
          //           >
          //             {/* Plan Header */}
          //             <div className="flex justify-between items-center mb-4">
          //               <h3 className="text-xl font-semibold text-gray-900">
          //                 {plan.plan}
          //               </h3>
          //               <span
          //                 className={`px-3 py-1 text-xs rounded-full font-medium ${
          //                   plan.status === "Active"
          //                     ? "bg-green-100 text-green-800"
          //                     : "bg-red-100 text-red-800"
          //                 }`}
          //               >
          //                 {plan.status}
          //               </span>
          //             </div>

          //             {/* Basic Details */}
          //             <p className="text-sm text-gray-700">
          //               <span className="font-medium">Customer:</span>{" "}
          //               {sub.customer}
          //             </p>
          //             <p className="text-sm text-gray-700">
          //               <span className="font-medium">Quantity:</span>{" "}
          //               {plan.quantity}
          //             </p>
          //             <p className="text-sm text-gray-700">
          //               <span className="font-medium">Price:</span> ${plan.price}
          //             </p>

          //             {/* Button */}
          //             <div className="mt-4">
          //               <button
          //                 onClick={() => setSelectedPlan(plan)}
          //                 className="w-full bg-[#7d4fff] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#6c3fee] transition"
          //               >
          //                 View Details
          //               </button>
          //             </div>
          //           </div>
          //         ))
          //       )}
          //     </div>
          //   ) : (
          //     <div className="bg-white rounded-2xl shadow-lg p-8 text-center border-2 border-dashed border-gray-200">
          //       <h3 className="text-lg font-medium text-gray-900 mb-2">
          //         No Active Subscriptions
          //       </h3>
          //       <p className="text-gray-500">No plans found.</p>
          //     </div>
          //   )}
          // </>

          <>  
          {subscriptions.length > 0 ? (
  <div className="space-y-4">
    {subscriptions.map((sub) =>
      sub.plans.map((plan, index) => (
        <div
          key={`${sub.name}-${index}`}
          className="flex justify-between items-center bg-white rounded-lg shadow p-4 border border-gray-100 hover:shadow-md transition"
        >
          {/* Left side info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {plan.plan}
            </h3>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Customer:</span> {sub.customer}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Quantity:</span> {plan.quantity}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Price:</span> ${plan.price}
            </p>
          </div>

          {/* Right side status + button */}
          <div className="flex flex-col items-end space-y-2">
            <span
              className={`px-3 py-1 text-xs rounded-full font-medium ${
                plan.status === "Active"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {plan.status}
            </span>
            <button
              onClick={() => setSelectedPlan(plan)}
              className="bg-[#7d4fff] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#6c3fee] transition"
            >
              View Details
            </button>
          </div>
        </div>
      ))
    )}
  </div>
) : (
  <div className="bg-white rounded-2xl shadow-lg p-8 text-center border-2 border-dashed border-gray-200">
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      No Active Subscriptions
    </h3>
    <p className="text-gray-500">No plans found.</p>
  </div>
)}

          </>
        )}

        {/* Modal */}
        {selectedPlan && (
          <div className="fixed inset-0 bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
              <button
                onClick={() => setSelectedPlan(null)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {selectedPlan.plan} Details
              </h2>
              <div className="space-y-2 text-gray-700">
                <p>
                  <span className="font-medium">Quantity:</span>{" "}
                  {selectedPlan.quantity}
                </p>
                <p>
                  <span className="font-medium">Service Start Date:</span>{" "}
                  {selectedPlan.service_start_date}
                </p>
                <p>
                  <span className="font-medium">Billing Start Date:</span>{" "}
                  {selectedPlan.billing_start_date}
                </p>
                <p>
                  <span className="font-medium">Status:</span>{" "}
                  {selectedPlan.status}
                </p>
                <p>
                  <span className="font-medium">Price:</span> $
                  {selectedPlan.price}
                </p>
                <p>
                  <span className="font-medium">IPV4 Assignment Method:</span> 
                  {selectedPlan.ipv4_assignment_method}
                </p><p>
                  <span className="font-medium">Service Login:</span> 
                  {selectedPlan.service_login}
                </p><p>
                  <span className="font-medium">Service Password:</span> 
                  {selectedPlan.service_password}
                </p><p>
                  <span className="font-medium">Location:</span> 
                  {selectedPlan.location}
                </p><p>
                  <span className="font-medium">Router:</span> 
                  {selectedPlan.router}
                </p><p>
                  <span className="font-medium">Pay Period:</span> 
                  {selectedPlan.pay_period}
                </p>
                <p>
                  <span className="font-medium">Description:</span> 
                  {selectedPlan.description}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscription;
