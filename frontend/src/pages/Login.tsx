import { useEffect, useState } from "react";
import { useFrappeAuth } from "frappe-react-sdk";
import { useNavigate } from "react-router-dom";
import cliSecureLogo from "../assets/clisecure logo.png";

const Login = () => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string | undefined>(undefined);

  const { login, isLoading, currentUser } = useFrappeAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate("/");
    }
  }, [currentUser, navigate]);

  const onLogin = () => {
    setLoginError(undefined);
    login({ username, password })
      .then(() => {})
      .catch(() => {
        setLoginError("Invalid username or password.");
      });
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gray-100">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
          <div className="text-lg font-medium text-gray-700 animate-pulse">
            Logging in...
          </div>
        </div>
      )}
      <form className="w-full max-w-md p-8 relative z-0" action={onLogin} method="POST">
        <div className="w-full max-w-md bg-white shadow-md rounded-lg p-8 relative z-0">
          <img
            src={cliSecureLogo}
            alt="CLI Secure Logo"
            className="w-20 h-14 object-contain mx-auto"
          />
          <h2 className="text-2xl font-semibold text-center text-gray-800 mb-8">
            Login to CLI Secure Portal
          </h2>

          {loginError && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm border border-red-300">
              {loginError}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Username/Email
            </label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring focus:ring-blue-200"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring focus:ring-blue-200"
            />
          </div>

          <button
            onClick={onLogin}
            disabled={isLoading}
            className="w-full bg-[#7d4fff] text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;
