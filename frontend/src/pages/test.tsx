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