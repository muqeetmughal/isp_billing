import { useEffect, useState } from "react";
import axios from "axios";
import { useFrappeAuth } from "frappe-react-sdk";

interface Invoice {
  name: string;
  customer: string;
  posting_date: string;
  grand_total: number;
  currency: string;
  status: "Paid" | "Unpaid" | "Overdue" | string;
}

const Invoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const { currentUser } = useFrappeAuth();

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        const response = await axios.get(
          "/api/method/isp_billing.api.sales_invoice.get_sales_invoice",
          {
            params: { email: currentUser },
          }
        );
        const fetchedInvoices: Invoice[] = response.data.message;
        setInvoices(fetchedInvoices);
        setFilteredInvoices(fetchedInvoices);
      } catch (error) {
        console.error("Failed to fetch invoices:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [currentUser]);

  useEffect(() => {
    const filtered = invoices.filter((invoice) => {
      const matchesSearch =
        invoice.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.customer.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter
        ? invoice.status.toLowerCase() === statusFilter.toLowerCase()
        : true;

      return matchesSearch && matchesStatus;
    });

    setFilteredInvoices(filtered);
  }, [searchQuery, statusFilter, invoices]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Invoices</h1>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearchQuery(e.target.value)
          }
          placeholder="Search invoices..."
          className="w-full sm:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setStatusFilter(e.target.value)
          }
          className="w-full sm:w-1/4 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="Paid">Paid</option>
          <option value="Unpaid">Unpaid</option>
          <option value="Overdue">Overdue</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center mt-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-500">Loading invoices...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-100 text-gray-600 text-sm font-semibold">
              <tr>
                <th className="px-6 py-4 text-left">Invoice #</th>
                <th className="px-6 py-4 text-left">Client</th>
                <th className="px-6 py-4 text-left">Date</th>
                <th className="px-6 py-4 text-left">Amount</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.name} className="border-t hover:bg-gray-50">
                  <td className="px-6 py-4">{invoice.name}</td>
                  <td className="px-6 py-4">{invoice.customer}</td>
                  <td className="px-6 py-4">{invoice.posting_date}</td>
                  <td className="px-6 py-4">
                    {invoice.currency} {invoice.grand_total.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        invoice.status === "Paid"
                          ? "bg-green-100 text-green-700"
                          : invoice.status === "Unpaid"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {/* <button className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors duration-200">
                      View Details
                    </button> */}

                    <button
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors duration-200"
                      onClick={() => {
                        setSelectedInvoice(invoice);
                        setViewModalOpen(true);
                      }}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-500 py-4">
                    No invoices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {viewModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6 relative">
            <button
              onClick={() => setViewModalOpen(false)}
              className="absolute top-3 right-4 text-gray-500 text-xl font-bold hover:text-gray-700"
            >
              ×
            </button>
            <h2 className="text-xl font-semibold mb-4">Invoice Details</h2>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <strong>Invoice #:</strong> {selectedInvoice.name}
              </p>
              <p>
                <strong>Customer:</strong> {selectedInvoice.customer}
              </p>
              <p>
                <strong>Date:</strong> {selectedInvoice.posting_date}
              </p>
              <p>
                <strong>Amount:</strong> {selectedInvoice.currency}{" "}
                {selectedInvoice.grand_total.toFixed(2)}
              </p>
              <p>
                <strong>Status:</strong> {selectedInvoice.status}
              </p>
            </div>
            <div className="mt-4 text-right">
              <button
                onClick={() => setViewModalOpen(false)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
