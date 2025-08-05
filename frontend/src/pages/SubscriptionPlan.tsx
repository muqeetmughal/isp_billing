import React, { useEffect, useState } from 'react'
import axios from 'axios'

const SubscriptionPlans = () => {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axios.get('/api/method/isp_billing.api.subscription.get_subscription_plans')
        setPlans(response.data.message)
      } catch (error) {
        console.error('Error fetching plans:', error)
      }
    }

    fetchPlans()
  }, [])

  const handleSubscribe = async (planName) => {
    setLoading(true)
    try {
      const response = await axios.post('/api/method/isp_billing.api.subscription.create_subscription_from_plan_api', {
        customer: 'Sohail Bloch',
        plan_details: [{ plan: planName, qty: 1 }]
      })
      alert(`Subscription created: ${response.data.message}`)
    } catch (error) {
      console.error('Subscription error:', error)
      alert('Failed to create subscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Subscription Plans</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.name} className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition">
            <h2 className="text-xl font-semibold text-gray-800">{plan.name}</h2>
            <p className="text-gray-500 mt-1">{plan.price_determination}</p>

            <div className="mt-4">
              <span className="text-3xl font-bold text-gray-900">
                {plan.currency} {plan.cost}
              </span>
              <span className="text-gray-500 text-sm ml-1">/ {plan.item}</span>
            </div>

            <ul className="mt-4 text-sm text-gray-600 space-y-1">
              {plan.features?.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              onClick={() => handleSubscribe(plan.name)}
              disabled={loading}
            >
              {loading ? 'Subscribing...' : 'Subscribe'}
            </button>
          </div>
        ))}

        {plans.length === 0 && (
          <p className="text-center text-gray-500 col-span-full">No subscription plans available.</p>
        )}
      </div>
    </div>
  )
}

export default SubscriptionPlans
