import { useEffect, useState } from "react";
import axios from "axios";
import { useFrappeAuth } from "frappe-react-sdk";
import { CrossIcon } from "lucide-react";

interface PlanDetail {
  plan: string;
  qty: number;
  cost: number;
}

interface SubscriptionType {
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
  const [subscriptions, setSubscriptions] = useState<SubscriptionType[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Enhancement form states
  const [showEnhancementForm, setShowEnhancementForm] = useState(false);
  const [selectedPlans, setSelectedPlans] = useState<PlanDetail[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [amount, setAmount] = useState("");

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

  // Create enhancement request
  const handleEnhancementRequest = async () => {
  if (!currentUser) {
    alert("No logged in user.");
    return;
  }
  if (!startDate || !endDate || !amount || selectedPlans.length === 0) {
    alert("Please fill all fields and select at least one plan.");
    return;
  }

  setLoading(true);
  try {
    // fetch customer name by email
    const customerRes = await axios.get(
      "/api/method/isp_billing.api.subscription.get_customer_name_by_email",
      { params: { email: currentUser } }
    );
    const customerName = customerRes.data.message;

    // now use that customer name
    await axios.post(
      "/api/method/isp_billing.api.payment_setup.create_subscription_with_payment",
      {
        customer: customerName,
        plan: selectedPlans,
        start_date: startDate,
        end_date: endDate,
        amount: amount,
      }
    );

      setShowEnhancementForm(false);
      setSelectedPlans([]);
      setStartDate("");
      setEndDate("");
      setAmount("");

    alert("Subscription enhancement request created successfully!");
  } catch (error) {
    console.error("Enhancement creation error:", error);
    alert("Failed to create subscription enhancement");
  } finally {
    setLoading(false);
  }
};





  const isCurrentPlan = (planName: string) => {
    return subscriptions.some((sub) =>
      sub.plans.some((p) => p.plan === planName)
    );
  };

  const togglePlanSelection = (planName: string, cost: number) => {
    setSelectedPlans((prev) => {
      const exists = prev.find((p) => p.plan === planName);
      let updated;
      if (exists) {
        // remove if already selected
        updated = prev.filter((p) => p.plan !== planName);
      } else {
        // add with default qty = 1
        updated = [...prev, { plan: planName, qty: 1, cost }];
      }
      // recalc total
      const total = updated.reduce((sum, p) => sum + p.qty * p.cost, 0);
      setAmount(total.toString());
      return updated;
    });
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
          <button
            onClick={() => setShowEnhancementForm(!showEnhancementForm)}
            className="bg-[#7d4fff] hover:bg-[#6c38fa] text-white px-4 py-2 rounded-lg shadow"
          >
            Create Enhancement Request
          </button>
        </div>

        {/* Enhancement Form - Toggle */}
        {showEnhancementForm && (
          <div className="bg-black/15 shadow-lg p-6 mb-8 fixed top-0 left-0 h-full w-full z-50">
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-10 top-1/2 left-1/2 transform translate-x-1/2 translate-y-[15%] max-w-3xl w-full">
            <div className="flex justify-between items-center mb-4">

            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Create Subscription Enhancement
            </h2>
            <button
              onClick={() => setShowEnhancementForm(!showEnhancementForm)}>
              <CrossIcon className="transform rotate-45"/>
            </button>
            </div>
            {/* Start & End Date */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  type="date"
                  className="w-full border rounded-lg p-2 mt-1"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  End Date
                </label>
                <input
                  type="date"
                  className="w-full border rounded-lg p-2 mt-1"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Auto Calculated Amount */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700">
                Amount
              </label>
              <input
                type="number"
                className="w-full border rounded-lg p-2 mt-1 bg-gray-100"
                value={amount}
                readOnly
              />
            </div>

            {/* Plan Selection */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700">
                Select Plans
              </label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                {plans.map((plan) => {
                  const selected = selectedPlans.find(
                    (p) => p.plan === plan.name
                  );
                  return (
                    <div
                      key={plan.name}
                      className={`p-4 border rounded-lg cursor-pointer ${
                        selected
                          ? "border-[#7d4fff] bg-blue-50"
                          : "border-gray-200"
                      }`}
                      onClick={() => togglePlanSelection(plan.name, plan.cost)}
                    >
                      <p className="text-gray-500 text-sm">
                        {plan.currency} {plan.cost} / {plan.item}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleEnhancementRequest}
              disabled={loading}
              className="w-full bg-[#7d4fff] hover:bg-[#6c38fa] disabled:bg-[#9e7aff] text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              {loading ? "Processing..." : "Create Enhancement Request"}
            </button>
          </div>
            </div>
        )}

        {/* === Keep your existing subscriptions + available plans sections === */}
        {/* Current Subscriptions + Available Plans here (unchanged from your first code) */}

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
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
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

                    {/* {!isCurrentPlan(plan.name) && (
                      <button
                        onClick={() => handleSubscribe(plan.name)}
                        disabled={loading}
                        className="w-full bg-[#7d4fff] hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
                      >
                        {loading ? "Processing..." : "Subscribe Now"}
                      </button>
                    )} */}
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
