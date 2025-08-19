
import { useParams } from "react-router-dom";

// const Success: React.FC = () => {
function Success() {
    const { id } = useParams();
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-lg rounded-2xl p-8 max-w-md text-center">
        <h1 className="text-2xl font-bold text-green-600 mb-4">
          Payment Successful!
        </h1>
        <p className="text-gray-700">
          Your payment has been successfully processed for {id}.
        </p>
      </div>
    </div>
  );
};

export default Success;
