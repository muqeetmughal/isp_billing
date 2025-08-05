import { useEffect, useState } from "react";
import axios from "axios";
import { useFrappeAuth } from "frappe-react-sdk";

interface PlanDetail {
  plan: string;
  qty: number;
}

interface Subscription {
  name: string;
  party_type: string;
  party: string;
  status: string;
  plans: PlanDetail[];
}

interface SubscriptionPlan {
  name: string;
  cost: number;
  currency: string;
  item: string;
  features?: string[];
  price_determination: string;
}

const Subscription = () => {
  const { currentUser } = useFrappeAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch current subscription
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!currentUser) return;

      try {
        const response = await axios.get(
          "/api/method/isp_billing.api.subscription.get_subscription_details",
          { params: { email: currentUser } }
        );
        if (response.data.message && response.data.message.length > 0) {
          setSubscription(response.data.message[0]);
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
      }
    };

    fetchSubscription();
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
    if (!subscription) return;

    setLoading(true);
    try {
      const response = await axios.post(
        "/api/method/isp_billing.api.subscription.create_subscription_from_plan_api",
        {
          customer: subscription.party,
          plan_details: [{ plan: planName, qty: 1 }],
        }
      );

      alert(`Subscription created: ${response.data.message}`);
      // Refresh subscription after subscribing
      const updated = await axios.get(
        "/api/method/isp_billing.api.subscription.get_subscription_details",
        { params: { email: currentUser } }
      );
      if (updated.data.message && updated.data.message.length > 0) {
        setSubscription(updated.data.message[0]);
      }
    } catch (error) {
      console.error("Subscription error:", error);
      alert("Failed to create subscription");
    } finally {
      setLoading(false);
    }
  };

  const isCurrentPlan = (planName: string) => {
    return (
      subscription &&
      subscription.plans &&
      subscription.plans.some((p) => p.plan === planName)
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Subscription Dashboard
          </h1>
          <p className="text-gray-600">
            Manage your subscription and explore available plans
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center mt-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-500">Loading invoices...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Current Subscription Section */}
            <div className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Current Subscription
              </h2>

              {subscription ? (
                <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-4">
                        <h3 className="text-2xl font-bold text-gray-900 mr-3">
                          Active Plans
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium
                          ${
                            subscription.status === "Active"
                              ? "bg-green-100 text-green-700 border border-green-200"
                              : "bg-red-100 text-red-700 border border-red-200"
                          }`}
                        >
                          {subscription.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <p className="font-medium text-gray-700">
                            Subscription ID
                          </p>
                          <p className="mt-1">{subscription.name}</p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <p className="font-medium text-gray-700 mb-1">
                          Subscribed Plans
                        </p>
                        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                          {subscription.plans.map((p, idx) => (
                            <li key={idx}>
                              {p.plan} — Qty: {p.qty}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="ml-6">{/* Manage Button if needed */}</div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center border-2 border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Active Subscription
                  </h3>
                  <p className="text-gray-500">
                    Choose from our available plans below to get started
                  </p>
                </div>
              )}
            </div>

            {/* Available Plans Section */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                {subscription ? "Other Available Plans" : "Choose Your Plan"}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <div
                    key={plan.name}
                    className={`bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-all duration-200 border-2
                    ${
                      isCurrentPlan(plan.name)
                        ? "border-blue-500 bg-blue-50"
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
                        <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
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

                    {plan.features && plan.features.length > 0 && (
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

                    {/* Subscribe button can be re-enabled as needed */}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Subscription;
