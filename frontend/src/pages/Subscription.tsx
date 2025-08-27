import { useEffect, useState } from "react";
import axios from "axios";
import { useFrappeAuth } from "frappe-react-sdk";
import type {
  SubscriptionPlan,
  SubscriptionType,
} from "../Data/globle";

const Subscription = () => {
  const { currentUser } = useFrappeAuth();
  const [subscriptions, setSubscriptions] = useState<SubscriptionType[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Fetch current subscriptions
  useEffect(() => {
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
  }, [currentUser]);

  // Fetch all available plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axios.get(
          "/api/method/isp_billing.api.subscription.get_subscription_plans"
        );
        setPlans(response.data.message);
      } catch (error) {
        console.error("Error fetching plans:", error);
      }
    };
    fetchPlans();
  }, []);

  const handleSubscribe = async (planName: string) => {
    if (!currentUser) {
      alert("No logged in user.");
      return;
    }
    setLoading(true);
    try {
      // fetch customer name from backend by email
      const customerRes = await axios.get(
        "/api/method/isp_billing.api.customer.get_customer_name_by_email",
        { params: { email: currentUser } }
      );
      const customerName = customerRes.data.message;

      // call your quotation creation API
      const res = await axios.post(
        "/api/method/isp_billing.api.subscription.create_sales_order_from_subscription_plan",
        {
          subscription_plan_name: planName,
          customer: customerName,
        }
      );

      alert(`Quotation Created Successfully: ${res.data.message}`);
    } catch (err) {
      console.error("Quotation creation error:", err);
      alert("Failed to create quotation");
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
      setSelectedPlan(null);
    }
  };

  const isCurrentPlan = (planName: string) => {
    return subscriptions.some((sub) =>
      sub.plans.some((p) => p.plan === planName)
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Subscription Dashboard
            </h1>
            <p className="text-gray-600">
              Manage your subscriptions and explore available plans
            </p>
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
          <>
            {/* Current Subscriptions List View */}
            <div className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Current Subscriptions
              </h2>

              {subscriptions.length > 0 ? (
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  {/* List Header */}
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                      <div className="col-span-3">Subscription Name</div>
                      <div className="col-span-2">Status</div>
                      <div className="col-span-2">Party</div>
                      <div className="col-span-3">Plans</div>
                      <div className="col-span-2">Quantities</div>
                    </div>
                  </div>

                  {/* List Items */}
                  <div className="divide-y divide-gray-200">
                    {subscriptions.map((sub, index) => (
                      <div
                        key={sub.name}
                        className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150"
                      >
                        <div className="grid grid-cols-12 gap-4 items-center">
                          {/* Subscription Name */}
                          <div className="col-span-3">
                            <div className="flex items-center">
                              <div className="w-2 h-8 bg-[#7d4fff] rounded-full mr-3"></div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {sub.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  ID: #{index + 1}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Status */}
                          <div className="col-span-2">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                sub.status === "Active"
                                  ? "bg-green-100 text-green-800 border border-green-200"
                                  : "bg-red-100 text-red-800 border border-red-200"
                              }`}
                            >
                              <div
                                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                  sub.status === "Active"
                                    ? "bg-green-400"
                                    : "bg-red-400"
                                }`}
                              ></div>
                              {sub.status}
                            </span>
                          </div>

                          {/* Party */}
                          <div className="col-span-2">
                            <p className="text-sm text-gray-900 font-medium">
                              {sub.party}
                            </p>
                            <p className="text-xs text-gray-500">
                              {sub.party_type}
                            </p>
                          </div>

                          {/* Plans */}
                          <div className="col-span-3">
                            <div className="space-y-1">
                              {sub.plans.map((plan, planIndex) => (
                                <div
                                  key={planIndex}
                                  className="flex items-center"
                                >
                                  <div className="w-2 h-2 bg-[#7d4fff] rounded-full mr-2"></div>
                                  <span className="text-sm text-gray-700 font-medium">
                                    {plan.plan}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Quantities */}
                          <div className="col-span-2">
                            <div className="space-y-1">
                              {sub.plans.map((plan, planIndex) => (
                                <div
                                  key={planIndex}
                                  className="flex items-center justify-center"
                                >
                                  <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-[#7d4fff] text-xs font-medium rounded-full">
                                    {plan.qty}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center border-2 border-dashed border-gray-200">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Active Subscriptions
                  </h3>
                  <p className="text-gray-500">
                    Choose from our available plans below to get started
                  </p>
                </div>
              )}
            </div>

            {/* Available Plans Section */}
            <div className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                {subscriptions.length > 0
                  ? "Other Available Plans"
                  : "Choose Your Plan"}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <div
                    key={plan.name}
                    className={`bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-all duration-200 border-2 ${
                      isCurrentPlan(plan.name)
                        ? "border-[#7d4fff] bg-blue-50"
                        : "border-transparent hover:border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">
                          {plan.name}
                        </h3>
                        <p className="text-gray-500 text-sm mt-1">
                          {plan.price_determination}
                        </p>
                      </div>
                      {isCurrentPlan(plan.name) && (
                        <span className="bg-[#7d4fff] text-white px-2 py-1 rounded-full text-xs font-medium">
                          Current
                        </span>
                      )}
                    </div>

                    <div className="mb-6">
                      <span className="text-3xl font-bold text-gray-900">
                        {plan.currency} {plan.cost}
                      </span>
                      <span className="text-gray-500 text-sm ml-1">
                        / {plan.item}
                      </span>
                    </div>

                    {Array.isArray(plan.features) && plan.features.length > 0 && (
                      <ul className="mb-6 text-sm text-gray-600 space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <svg
                              className="w-4 h-4 text-green-500 mr-2 flex-shrink-0"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    )}

                    {!isCurrentPlan(plan.name) && (
                      <button
                        onClick={() => {
                          setSelectedPlan(plan.name);
                          setShowConfirmModal(true);
                        }}
                        disabled={loading}
                        className="w-full bg-[#7d4fff] hover:bg-[#6c38fa] disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {loading ? "Processing..." : "Subscribe Now"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && selectedPlan && (
              <div className="fixed inset-0 flex items-center justify-center bg-opacity-50 z-50">
                <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Confirm Subscription
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to subscribe to <b>{selectedPlan}</b>?
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowConfirmModal(false)}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSubscribe(selectedPlan)}
                      className="px-4 py-2 rounded-lg bg-[#7d4fff] text-white hover:bg-[#6c38fa] cursor-pointer"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Subscription;
