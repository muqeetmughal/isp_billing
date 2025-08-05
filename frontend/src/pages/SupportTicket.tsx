import { useEffect, useState } from "react";
import axios from "axios";
import { useFrappeAuth } from "frappe-react-sdk";

interface SupportTicket {
  name: string;
  customer: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  custom_group: string;
  custom_type: string;
  custom_assigned_to: string;
  custom_watchers: string;
}

const SupportTicket = () => {
  const [issues, setIssues] = useState<SupportTicket[]>([]);
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

  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
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

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Customer Issues</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + New Ticket
        </button>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/20 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create New Ticket</h2>
              <button
                onClick={handleModalClose}
                className="text-xl font-bold text-gray-600 cursor-pointer"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full border px-3 py-2 rounded"
                  required
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border px-3 py-2 rounded resize-vertical"
                  required
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Customer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  className="w-full border px-3 py-2 rounded"
                  required
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Issue Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full border px-3 py-2 rounded"
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
                <label className="block text-sm font-medium mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full border px-3 py-2 rounded"
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
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">Group</label>
                <select
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  className="w-full border px-3 py-2 rounded"
                  disabled={submitting}
                >
                  {["Any", "IT", "Finance", "Sales"].map((grp) => (
                    <option key={grp} value={grp}>
                      {grp}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={selectType}
                  onChange={(e) => setSelectType(e.target.value)}
                  className="w-full border px-3 py-2 rounded"
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
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                >
                  {submitting ? "Creating..." : "Create Ticket"}
                </button>
                <button
                  type="button"
                  onClick={handleModalClose}
                  disabled={submitting}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-black/20 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Ticket Details</h2>
              <button
                onClick={() => setViewModalOpen(false)}
                className="text-xl font-bold text-gray-600 cursor-pointer"
              >
                ×
              </button>
            </div>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <strong>ID:</strong> {selectedTicket.name}
              </p>
              <p>
                <strong>Customer:</strong> {selectedTicket.customer}
              </p>
              <p>
                <strong>Subject:</strong> {selectedTicket.subject}
              </p>
              <p>
                <strong>Description:</strong> {selectedTicket.description}
              </p>
              <p>
                <strong>Status:</strong> {selectedTicket.status}
              </p>
              <p>
                <strong>Priority:</strong> {selectedTicket.priority}
              </p>
              <p>
                <strong>Group:</strong> {selectedTicket.custom_group}
              </p>
              <p>
                <strong>Type:</strong> {selectedTicket.custom_type}
              </p>
              <p>
                <strong>Assigned To:</strong>{" "}
                {selectedTicket.custom_assigned_to}
              </p>
              <p>
                <strong>Watchers:</strong> {selectedTicket.custom_watchers}
              </p>
            </div>
            <div className="mt-4 text-right">
              <button
                onClick={() => setViewModalOpen(false)}
                className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Table */}
      {loading ? (
        <div className="flex justify-center mt-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p>Loading issues...</p>
          </div>
        </div>
      ) : issues.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
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
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider"
                  >
                    {title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {issues.map((issue) => (
                <tr key={issue.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium truncate">
                    {issue.name}
                  </td>
                  <td className="px-6 py-4 text-sm truncate">
                    {issue.customer}
                  </td>
                  <td className="px-6 py-4 text-sm truncate">
                    {issue.subject}
                  </td>
                  <td
                    className="px-6 py-4 text-sm truncate max-w-xs"
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
                  <td className="px-6 py-4 text-sm">{issue.custom_group}</td>
                  <td className="px-6 py-4 text-sm">{issue.custom_type}</td>
                  <td className="px-6 py-4 text-sm">
                    {issue.custom_assigned_to}
                  </td>
                  <td className="px-6 py-4 text-sm">{issue.custom_watchers}</td>
                  <td className="px-6 py-4 text-sm">
                    {/* <button className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                      View
                    </button> */}
                    <button
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
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
