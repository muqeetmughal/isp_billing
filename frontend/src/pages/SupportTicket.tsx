import { useEffect, useState } from "react";
import axios from "axios";
import { useFrappeAuth } from "frappe-react-sdk";
import type { SupportTicketData } from "../Data/globle";



const SupportTicket = () => {
  const [issues, setIssues] = useState<SupportTicketData[]>([]);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [customer, setCustomer] = useState("");
  const [issueType, setIssueType] = useState("");
  const [group, setGroup] = useState("");
  const [selectType, setSelectType] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [issueTypes, setIssueTypes] = useState<{ name: string }[]>([]);
  const [priorities, setPriorities] = useState<{ name: string }[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedTicket, setSelectedTicket] = useState<SupportTicketData | null>(
    null
  );
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const { currentUser } = useFrappeAuth();

  const fetchIssues = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const response = await axios.get(
        "/api/method/isp_billing.api.issue.get_issues",
        {
          params: { email: currentUser },
        }
      );
      setIssues(response.data.message || []);
    } catch (error) {
      console.error("Error fetching issues:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [typeRes, priorityRes] = await Promise.all([
        axios.get("/api/method/isp_billing.api.issue.get_issue_type"),
        axios.get("/api/method/isp_billing.api.issue.get_issue_priority"),
      ]);
      setIssueTypes(typeRes.data.message || []);
      setPriorities(priorityRes.data.message || []);
    } catch (error) {
      console.error("Error fetching dropdowns:", error);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchIssues();
      fetchDropdowns();
    }
  }, [currentUser]);

  const resetForm = () => {
    setSubject("");
    setDescription("");
    setCustomer("");
    setIssueType("");
    setPriority("Medium");
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (
      !subject.trim() ||
      !description.trim() ||
      !customer.trim() ||
      !issueType
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      setSubmitting(true);
      await axios.post("/api/method/isp_billing.api.issue.create_issue", {
        subject: subject.trim(),
        description: description.trim(),
        email: currentUser,
        customer: customer.trim(),
        issue_type: issueType,
        priority,
        group,
        select_type: selectType,
      });
      alert("Issue created successfully.");
      resetForm();
      setModalOpen(false);
      fetchIssues();
    } catch (error) {
      console.error("Error creating issue:", error);
      alert("Failed to create issue. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalClose = () => {
    if (submitting) return;
    resetForm();
    setModalOpen(false);
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modalOpen && !submitting) {
        handleModalClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [modalOpen, submitting]);

  const getStatusBadge = (status: string) => {
    const base = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case "Open":
        return `${base} bg-yellow-100 text-yellow-700`;
      case "Closed":
        return `${base} bg-green-100 text-green-700`;
      default:
        return `${base} bg-gray-200 text-gray-700`;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const base = "px-2 py-1 rounded-full text-xs font-medium";
    switch (priority) {
      case "High":
        return `${base} bg-red-100 text-red-700`;
      case "Medium":
        return `${base} bg-orange-100 text-orange-700`;
      case "Low":
        return `${base} bg-blue-100 text-blue-700`;
      default:
        return `${base} bg-gray-200 text-gray-700`;
    }
  };
  useEffect(() => {
    if (modalOpen && currentUser) {
      const fetchCustomer = async () => {
        try {
          const customerRes = await axios.get(
            "/api/method/isp_billing.api.customer.get_customer_name_by_email",
            { params: { email: currentUser } }
          );
          const customerName = customerRes.data.message;
          if (customerName) {
            setCustomer(customerName); // auto-fill customer field
          }
        } catch (err) {
          console.error("Failed to fetch customer:", err);
        }
      };

      fetchCustomer();
    }
  }, [modalOpen, currentUser]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Customer Issues</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-[#7d4fff] text-white px-4 py-2 rounded hover:bg-[#6c38fa] cursor-pointer"
        >
          + New Ticket
        </button>
      </div>

      {/* Modal */}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto border border-gray-100">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                Create New Ticket
              </h2>
              <button
                onClick={handleModalClose}
                className="text-2xl text-gray-500 hover:text-gray-700 transition"
              >
                ×
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-[#7d4fff] focus:border-[#7d4fff] outline-none transition disabled:bg-gray-100"
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-[#7d4fff] focus:border-[#7d4fff] outline-none transition resize-vertical disabled:bg-gray-100"
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Customer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-[#7d4fff] focus:border-[#7d4fff] outline-none transition disabled:bg-gray-100"
                  required
                  disabled={true}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Issue Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-[#7d4fff] focus:border-[#7d4fff] outline-none transition disabled:bg-gray-100"
                  required
                  disabled={submitting}
                >
                  <option value="">Select Issue Type</option>
                  {issueTypes.map((type) => (
                    <option key={type.name} value={type.name}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-[#7d4fff] focus:border-[#7d4fff] outline-none transition disabled:bg-gray-100"
                  disabled={submitting}
                >
                  {priorities.length > 0
                    ? priorities.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.name}
                        </option>
                      ))
                    : ["Low", "Medium", "High"].map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Group
                </label>
                <select
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-[#7d4fff] focus:border-[#7d4fff] outline-none transition disabled:bg-gray-100"
                  disabled={submitting}
                >
                  {["Any", "IT", "Finance", "Sales"].map((grp) => (
                    <option key={grp} value={grp}>
                      {grp}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Type
                </label>
                <select
                  value={selectType}
                  onChange={(e) => setSelectType(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-[#7d4fff] focus:border-[#7d4fff] outline-none transition disabled:bg-gray-100"
                  disabled={submitting}
                >
                  {[
                    "Question",
                    "Incident",
                    "Problem",
                    "Feature Request",
                    "Lead",
                    "Service Change",
                  ].map((typ) => (
                    <option key={typ} value={typ}>
                      {typ}
                    </option>
                  ))}
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#7d4fff] text-white py-2.5 px-4 rounded-lg shadow hover:bg-[#6c38fa] transition disabled:opacity-70"
                >
                  {submitting ? "Creating..." : "Create Ticket"}
                </button>
                <button
                  type="button"
                  onClick={handleModalClose}
                  disabled={submitting}
                  className="flex-1 bg-gray-200 text-gray-700 py-2.5 px-4 rounded-lg shadow hover:bg-gray-300 transition disabled:opacity-70 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
  <div
    className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto 
               p-6 animate-[fadeIn_0.25s_ease-out]"
  >
    {/* Header */}
    <div className="flex justify-between items-center border-b pb-3 mb-4">
      <h2 className="text-2xl font-semibold text-gray-800">🎫 Ticket Details</h2>
      <button
        onClick={() => setViewModalOpen(false)}
        className="text-gray-500 hover:text-gray-800 text-2xl leading-none cursor-pointer"
      >
        ×
      </button>
    </div>

    {/* Content */}
    <div className="space-y-4 text-sm">
      <div className="flex justify-between">
        <span className="font-medium text-gray-600">ID</span>
        <span className="text-gray-900">{selectedTicket.name}</span>
      </div>

      <div className="flex justify-between">
        <span className="font-medium text-gray-600">Customer</span>
        <span className="text-gray-900">{selectedTicket.customer}</span>
      </div>

      <div className="flex justify-between">
        <span className="font-medium text-gray-600">Subject</span>
        <span className="text-gray-900">{selectedTicket.subject}</span>
      </div>

      <div>
        <span className="font-medium text-gray-600">Description</span>
        <p className="text-gray-900 mt-1 bg-gray-50 rounded-lg p-3 text-sm leading-relaxed">
          {selectedTicket.description}
        </p>
      </div>

      <div className="flex justify-between items-center">
        <span className="font-medium text-gray-600">Status</span>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            selectedTicket.status === "Open"
              ? "bg-green-100 text-green-700"
              : selectedTicket.status === "Closed"
              ? "bg-gray-200 text-gray-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {selectedTicket.status}
        </span>
      </div>

      <div className="flex justify-between items-center">
        <span className="font-medium text-gray-600">Priority</span>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            selectedTicket.priority === "High"
              ? "bg-red-100 text-red-700"
              : selectedTicket.priority === "Medium"
              ? "bg-orange-100 text-orange-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {selectedTicket.priority}
        </span>
      </div>

      <div className="flex justify-between">
        <span className="font-medium text-gray-600">Group</span>
        <span className="text-gray-900">{selectedTicket.custom_group}</span>
      </div>

      <div className="flex justify-between">
        <span className="font-medium text-gray-600">Type</span>
        <span className="text-gray-900">{selectedTicket.custom_type}</span>
      </div>

      <div className="flex justify-between">
        <span className="font-medium text-gray-600">Assigned To</span>
        <span className="text-gray-900">
          {selectedTicket.custom_assigned_to}
        </span>
      </div>

      <div>
        <span className="font-medium text-gray-600">Watchers</span>
        <p className="text-gray-900 mt-1">{selectedTicket.custom_watchers}</p>
      </div>
    </div>

    {/* Footer */}
    <div className="mt-6 text-right">
      <button
        onClick={() => setViewModalOpen(false)}
        className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-5 py-2.5 rounded-xl shadow hover:opacity-90 transition cursor-pointer"
      >
        Close
      </button>
    </div>
  </div>

  {/* Tailwind keyframes */}
  <style>
    {`
      @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
    `}
  </style>
</div>

      )}

      {/* Issue Table */}
      {loading ? (
        <div className="flex justify-center mt-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7d4fff] mx-auto mb-2"></div>
            <p>Loading issues...</p>
          </div>
        </div>
      ) : issues.length > 0 ? (

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  {[
                    "ID",
                    "Customer",
                    "Subject",
                    "Description",
                    "Status",
                    "Priority",
                    "Group",
                    "Type",
                    "Assigned To",
                    "Watchers",
                    "Actions",
                  ].map((title) => (
                    <th
                      key={title}
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide border-b"
                    >
                      {title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {issues.map((issue, idx) => (
                  <tr
                    key={issue.name}
                    className={`${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-gray-100 transition-colors`}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 truncate">
                      {issue.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 truncate">
                      {issue.customer}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 truncate">
                      {issue.subject}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-gray-600 truncate max-w-xs"
                      title={issue.description}
                    >
                      {issue.description}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={getStatusBadge(issue.status)}>
                        {issue.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={getPriorityBadge(issue.priority)}>
                        {issue.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {issue.custom_group}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {issue.custom_type}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {issue.custom_assigned_to}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {issue.custom_watchers}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        className="bg-[#7d4fff] text-white px-4 py-1.5 rounded-lg shadow hover:bg-[#6c38fa] transition cursor-pointer"
                        onClick={() => {
                          setSelectedTicket(issue);
                          setViewModalOpen(true);
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 mt-20">
          <p className="text-lg mb-2">No issues found.</p>
          <p className="text-sm">
            Click "New Ticket" to create your first support ticket.
          </p>
        </div>
      )}
    </div>
  );
};

export default SupportTicket;
