import "./App.css";
import { FrappeProvider } from "frappe-react-sdk";
import { Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import MainLayout from "./layouts/MainLayout";
import Invoices from "./pages/Invoices";
import SupportTicket from "./pages/SupportTicket";
import Login from "./pages/Login";
import PrivateRoute from "./component/PrivateRoute";
import Subscription from "./pages/Subscription";
import AdminDashboard from "./pages/admin_dashboard";
import Success from "./pages/success";

function App() {
  return (
    <div className="App">
      <FrappeProvider>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route path="" element={<MainLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={<Home />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/subscription" element={<Subscription />} />
              <Route path="/support_tickets" element={<SupportTicket />} />
              <Route path="/admin_dashboard" element={<AdminDashboard/>}/>
              <Route path="/success" element={<Success/>}/>
              <Route path="*" element={<>404 Not Found</>} />
            </Route>
          </Route>
        </Routes>
      </FrappeProvider>
    </div>
  );
}

export default App;
