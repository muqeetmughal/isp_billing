import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  CardElement,
  Elements,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useFrappeAuth } from "frappe-react-sdk";


// ✅ Replace with your real publishable key
const stripePromise = loadStripe(
  "pk_test_51Qed64QN9Rybq9aclTLmDv3iWdipg2tyrjlKBEm87umnAGSWGXpWxdhPnhfJOgyi0qRw0Sw4eAQwDHvtyziGEzA700mplNePqJ"
);

interface SaveCardFormProps {
  customerId: string;
}

const SaveCardForm: React.FC<SaveCardFormProps> = () => {

  const { currentUser } = useFrappeAuth();
  React.useEffect(() => {
  setEmail(currentUser as string);
}, [currentUser]);
  const stripe = useStripe();
  const elements = useElements();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);

    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      console.error("CardElement not found");
      return;
    }

    setLoading(true);

    // 1. Create PaymentMethod
    const { paymentMethod, error } = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement,
      billing_details: { name, email },
    });

    if (error) {
      setMessage(error.message || "Something went wrong.");
      setLoading(false);
      return;
    }

    console.log("PaymentMethod created:", paymentMethod.id);

    // 2. Send PaymentMethod to backend
    try {
      const res = await fetch(
        "/api/method/isp_billing.api.stripe.create_customer_and_payment_method",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            name,
            payment_method_id: paymentMethod.id,
          }),
        }
      );

      const data = await res.json();
      console.log("Response from backend:", data);
      setMessage("Card saved successfully!");
    } catch (err) {
      console.error("Error attaching payment method:", err);
      setMessage("Error saving card.");
    }

    setLoading(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto p-6 space-y-4 border rounded-xl shadow-md bg-white mt-20"
    >
      <h2 className="text-xl font-semibold text-gray-700 mb-2">
        Save Your Card
      </h2>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-600">
          Name
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded-lg focus:ring focus:ring-indigo-300 outline-none"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-600">
          Email
        </label>
        <input
          type="email"
          required
        //   value={email}
        value={currentUser ?? ""}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded-lg focus:ring focus:ring-indigo-300 outline-none"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-600">
          Card Details
        </label>
        <div className="p-3 border rounded-lg">
          <CardElement
            options={{
              hidePostalCode: true,
              style: {
                base: {
                  fontSize: "16px",
                  color: "#32325d",
                  "::placeholder": { color: "#a0aec0" },
                },
                invalid: { color: "#e53e3e" },
              },
            }}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Card"}
      </button>

      {message && (
        <p className="text-center text-sm mt-2 text-gray-700">{message}</p>
      )}
    </form>
  );
};

const StripePage: React.FC = () => {
  return (
    <Elements stripe={stripePromise}>
      <SaveCardForm customerId="cus_123456789" />
    </Elements>
  );
};

export default StripePage;
