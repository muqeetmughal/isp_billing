import React from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  CardElement,
  Elements,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

// ✅ Replace with your real publishable key
const stripePromise = loadStripe("pk_test_51Qed64QN9Rybq9aclTLmDv3iWdipg2tyrjlKBEm87umnAGSWGXpWxdhPnhfJOgyi0qRw0Sw4eAQwDHvtyziGEzA700mplNePqJ");

interface SaveCardFormProps {
  customerId: string;
}

const SaveCardForm: React.FC<SaveCardFormProps> = ({ customerId }) => {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      console.error("CardElement not found");
      return;
    }

    // 1. Create PaymentMethod from card
    const { paymentMethod, error } = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement,
      billing_details: {
        name: "John Doe",
        email: "john@example.com",
      },
    });

    if (error) {
      console.error(error.message);
      return;
    }

    console.log("PaymentMethod created:", paymentMethod.id);

    // 2. Send PaymentMethod ID + Customer ID to backend
    // try {
    //   const res = await fetch("/api/method/isp_billing.api.payment.create_customer_and_payment_method", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({
    //       customer_id: customerId,
    //       payment_method_id: paymentMethod.id,
    //     }),
    //   });

    //   const data = await res.json();
    //   console.log("Response from backend:", data);
    // } catch (err) {
    //   console.error("Error attaching payment method:", err);
    // }
    try {
  const res = await fetch(
    "/api/method/isp_billing.api.payment.create_customer_and_payment_method",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "john@example.com",   // dynamic later
        name: "John Doe",            // dynamic later
        payment_method_id: paymentMethod.id,
      }),
    }
  );

  const data = await res.json();
  console.log("Response from backend:", data);
} catch (err) {
  console.error("Error attaching payment method:", err);
}
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement options={{ hidePostalCode: true }} />
      <button type="submit" disabled={!stripe}>
        Save Card
      </button>
    </form>
  );
};

const StripePage: React.FC = () => {
  return (
    <Elements stripe={stripePromise}>
      {/* Pass the customer_id dynamically if you have it */}
      <SaveCardForm customerId="cus_123456789" />
    </Elements>
  );
};

export default StripePage;
