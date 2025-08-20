import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

function Success() {
  const { id } = useParams();
  const [message, setMessage] = useState("Processing your payment...");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const called = useRef(false);

  useEffect(() => {
    if (id && !called.current) {
      called.current = true;

      axios
        .post("/api/method/isp_billing.api.subscription.payment_success", {
          enhancement_id: id,
        })
        .then((res) => {
          if (res.data.message?.success) {
            setMessage(res.data.message.msg);
            setStatus("success");
            console.log("✅ Payment made successfully");
          } else {
            setMessage(res.data.message?.msg || "Something went wrong.");
            setStatus("error");
            console.log("❌ Payment failed");
          }
        })
        .catch((err) => {
          setMessage("An error occurred while processing your payment.");
          setStatus("error");
          console.error(err);
        });
    }
  }, [id]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-lg rounded-2xl p-8 max-w-md text-center">
        <h1
          className={`text-2xl font-bold mb-4 ${
            status === "success"
              ? "text-green-600"
              : status === "error"
              ? "text-red-600"
              : "text-gray-600"
          }`}
        >
          {status === "success"
            ? "Payment Successful!"
            : status === "error"
            ? "Payment Failed!"
            : "Processing..."}
        </h1>
        <p className="text-gray-700">{message}</p>
        {id && (
          <p className="text-sm text-gray-500 mt-2">
            Reference ID: <span className="font-mono">{id}</span>
          </p>
        )}
      </div>
    </div>
  );
}

export default Success;
