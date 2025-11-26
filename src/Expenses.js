import { Link } from "react-router-dom";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { useEffect, useState } from "react";
import { IoFilter } from "react-icons/io5";

const Expenses = () => {
  const [expenditures, setExpenditures] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const totalPages = 5;
  const [expenditureDate, setExpenditureDate] = useState(
    new Date().toISOString().substring(0, 10)
  );

  const [formData, setFormData] = useState({
    supplierName: "",
    unitPrice: "",
    quantity: "",
    description: "",
    category: "",
    amount: "",
  });

  const fetchExpenditures = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(
        `/api/v1/expenditures?page=${page}&size=10`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        }
      );
      if (!response) {
        throw new Error("HTTP Error! status:" + response.status);
      }
      const data = await response.json();
      if (Array.isArray(data.content)) {
        setExpenditures(data.content);
      } else {
        console.error("API did not return an array:", data);
        setExpenditures([]);
      }
      console.log("API response:", data);
    } catch (err) {
      setError(err.message);
      console.error("Failed to fetch expenditures:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await fetch("/api/v1/suppliers", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
        },
      });
      if (!response.ok) {
        throw new Error("HTTP error! Status:" + response.status);
      }
      const data = await response.json();
      setSuppliers(data);
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
    }
  };

  const handleNext = () => {
    if (page < 4) {
      setPage(page + 1);
    }
  };

  const handlePrevious = () => {
    if (page > 0) {
      setPage(page - 1);
    }
  };

  const goToPage = (pageIndex) => {
    if (pageIndex >= 0 && pageIndex < totalPages) {
      setPage(pageIndex);
    }
  };

  useEffect(() => {
    fetchExpenditures();
    fetchSuppliers();
  }, [page]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => {
      const newData = { ...prevData, [name]: value };
      if (name === "quantity" || name === "unitPrice") {
        const quantity = parseFloat(newData.quantity) || 0;
        const unitPrice = parseFloat(newData.unitPrice) || 0;
        newData.amount = (quantity * unitPrice).toFixed(2);
      }
      return newData;
    });
  };

  const handleSaveRecord = async (e) => {
    e.preventDefault();
    const url = editingId
      ? `http://localhost:3000/api/v1/expenditures/${editingId}`
      : "http://localhost:3000/api/v1/expenditures";

    const method = editingId ? "PUT" : "POST";

    const unitPrice = parseFloat(formData.unitPrice);
    const quantity = parseInt(formData.quantity, 10);
    const calculatedAmount = unitPrice * quantity;

    const payload = {
      supplierId: parseInt(formData.supplierName, 10),
      unitPrice: unitPrice,
      quantity: quantity,
      description: formData.description,
      category: formData.category,
      amount: calculatedAmount,
      employeeId: 1,
      date: expenditureDate,
    };
    console.log("Payload being sent:", JSON.stringify(payload));

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          `HTTP error! Status: ${response.status}, Details:Failed to save`
        );
      }

      await fetchExpenditures();
      setFormData({
        supplierName: "",
        unitPrice: "",
        quantity: "",
        description: "",
        category: "",
        amount: "",
      });
      setEditingId(null);
    } catch (error) {
      console.error("Failed to save record:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/v1/expenditures/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! Status:${response.status}, Details:${errorText}`
        );
      }

      await fetchExpenditures();
    } catch (error) {
      console.error("Failed to delete record:", error);
    }
  };

  const handleEdit = (expense) => {
    setEditingId(expense.id);
    setFormData({
      supplierName: expense.supplierName,
      unitPrice: expense.unitPrice,
      quantity: expense.quantity,
      amount: expense.amount,
      description: expense.description,
      category: expense.category,
    });
    if (expense.date) {
      setExpenditureDate(expense.date.substring(0, 10));
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="text-sm text-gray-500 mb-1">
            <Link
              to="/"
              className="text-indigo-600 hover:text-indigo-800 transition"
            >
              Home
            </Link>
            <span className="mx-2 text-gray-400">&gt;</span>
            <span className="font-semibold text-gray-700">
              Expenditure Record
            </span>
          </div>
          <h2 className="text-3xl font-extrabold mt-2 text-gray-900">
            Expenditure Record Management
          </h2>
        </div>

        {/* Form Card */}
        <div className="bg-white p-8 rounded-xl shadow-2xl border border-gray-100 mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">
            {editingId
              ? "Edit Expenditure Record"
              : "Add New Expenditure Record"}
          </h3>

          <form onSubmit={handleSaveRecord}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8 items end">
              <div>
                <label
                  htmlFor="supplierName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Supplier <span className="text-red-500">*</span>
                </label>
                <select
                  id="supplierName"
                  name="supplierName"
                  className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 focus-outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-500 shadow-sm transition duration-150"
                  onChange={handleChange}
                  value={formData.supplierName}
                  required
                >
                  <option value="" disabled>
                    Select a supplier
                  </option>
                  {suppliers && suppliers.length > 0 ? (
                    suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))
                  ) : (
                    <option disabled>Loading suppliers...</option>
                  )}
                </select>
              </div>

              <div>
                <label
                  htmlFor="expenditureDate"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Date Of Expenditure <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="expenditureDate"
                  className="block w-full border border-gray-300 rounded py-2.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-500  shadow-sm transition duration-150"
                  onChange={(e) => setExpenditureDate(e.target.value)}
                  value={expenditureDate}
                  required
                />
              </div>

              <div className="md:col-span-2 lg:col-span-1 border border-indigo-300 p-4 rounded-xl bg-indigo-50/70 shadow-inner">
                <p className="text-sm font-semibold text-indigo-700 mb-3">
                  Cost Details
                </p>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label
                      htmlFor="unitPrice"
                      className="block text-xs font-medium text-gray-700"
                    >
                      Unit Price (₦)
                    </label>
                    <input
                      type="number"
                      id="unitPrice"
                      name="unitPrice"
                      onChange={handleChange}
                      value={formData.unitPrice}
                      placeholder="0.00"
                      className="block w-full border border-gray-300 rounded-lg  py-2 px-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm shadow-sm"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="qty"
                      className="block text-xs font-medium text-gray-700"
                    >
                      Qty
                    </label>
                    <input
                      type="number"
                      id="qty"
                      name="quantity"
                      placeholder="0"
                      className="block w-full border border-gray-300 rounded-lg py-2 px-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm shadow-sm"
                      onChange={handleChange}
                      value={formData.quantity}
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="amount"
                      className="block text-xs font-medium text-gray-700"
                    >
                      Total Amount (₦)
                    </label>
                    <input
                      type="text"
                      id="amount"
                      name="amount"
                      placeholder="Calculated"
                      className="block w-full border border-indigo-500 rounded-lg py-2 px-2 bg-indigo-50/70 text-indigo-800 font-bold text-sm cursor-not-allowed shadow-inner"
                      onChange={handleChange}
                      value={formData.amount}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  onChange={handleChange}
                  value={formData.category}
                  className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-500 shadow-sm transition duration-150"
                  required
                >
                  <option value="" disabled>
                    Select a category
                  </option>
                  <option value="ACQUISITION">ACQUISITION</option>
                  <option value="UTILITIES">UTILITIES</option>
                  <option value="MARKETING">MARKETING</option>
                  <option value="SALARIES">SALARIES</option>
                  <option value="TRANSPORTATION">TRANSPORTATION</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Item Description (What was purchased?){" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  placeholder="eg., 50 bags of Chick Feed, Tractor Oil Change, Monthly Labour Wages"
                  className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:outline-none  focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray500 shadow-sm transition duration-150"
                  onChange={handleChange}
                  value={formData.description}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              {editingId && (
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="w-60 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2.5 px-6 rounded-lg transition duration-150 focus:outline-none mr-3 shadow-md"
                >
                  Cancel Edit
                </button>
              )}

              <button
                type="submit"
                className={`w-60 font-semibold py-2.5 px-6 rounded-lg transition duration-150 ease-in-out text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  editingId
                    ? "bg-amber-500 hover:bg-amber-600 focus:ring-amber-500"
                    : "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 "
                }`}
              >
                {editingId ? "Update Record" : "Save Record"}
              </button>
            </div>
          </form>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full leading-normal divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    #
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Supplier
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Date
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Description
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Category
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(expenditures) &&
                  expenditures.map((expense, index) => (
                    <tr
                      key={expense.id}
                      className="even:bg-gray-50  hover:bg-indigo-50 transition duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 ">
                        {index + 1}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {expense.supplierName}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">
                        ₦
                        {parseFloat(expense.amount).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(expense.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 ">
                        {expense.description}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap ">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${
                          expense.category === "ACQUISITION"
                            ? "bg-indigo-100 text-indigo-800"
                            : expense.category === "SALARIES"
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                        >
                          {expense.category}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 flex items-center space-x-3">
                        <button
                          onClick={() => handleEdit(expense)}
                          title="Edit"
                        >
                          <FiEdit className="cursor-pointer text-indigo-600 hover:text-indigo-800 h-5 w-5  transition duration-150" />
                        </button>

                        <button
                          onClick={() => handleDelete(expense.id)}
                          title="Delete"
                        >
                          <FiTrash2 className="cursor-pointer text-red-600 hover:text-red-800 h-5 w-5 transition duration-150" />
                        </button>
                      </td>
                    </tr>
                  ))}
                {!Array.isArray(expenditures) ||
                  (expenditures.length === 0 && (
                    <tr>
                      <td
                        colSpan="7"
                        className="py-10 text-center text-gray-500"
                      >
                        {isLoading ? (
                          <span className="text-indigo-600 font-medium ">
                            Loading Expenditure Records...
                          </span>
                        ) : (
                          "No Expenditure Records Found"
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-6 rounded-b-xl shadow-inner">
          <div className="flex flex-1 items-center justify-between">
            {/* Left Side: Showing Results Count */}
            <div>
              {/* Display uses page + 1 for 1-based indexing */}
              <p className="text-sm text-gray-700">
                Showing Page <span className="font-medium">{page + 1}</span> of{" "}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>

            {/* Right Side: Centered Page Numbers */}
            <div>
              <nav
                className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                aria-label="Pagination"
              >
                {/* Previous Arrow Button */}
                <button
                  onClick={handlePrevious}
                  disabled={page === 0}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 transition"
                >
                  <span className="sr-only">Previous</span>
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.79 5.23a.75.75 0 010 1.06L9.56 10l3.23 3.71a.75.75 0 01-1.06 1.06l-3.75-3.75a.75.75 0 010-1.06l3.75-3.75a.75.75 0 011.06 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {/* Dynamic Page Buttons (Maps 0, 1, 2, 3, 4) */}
                {[...Array(totalPages).keys()].map((index) => {
                  const pageIndex = index; // 0, 1, 2, 3, 4
                  const pageNumberForUI = index + 1; // 1, 2, 3, 4, 5
                  const isActive = pageIndex === page;

                  return (
                    <button
                      key={pageIndex}
                      onClick={() => goToPage(pageIndex)} // Pass 0-based index to goToPage
                      aria-current={isActive ? "page" : undefined}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold 
                                ${
                                  isActive
                                    ? "bg-indigo-600 text-white focus:outline-none focus:z-20"
                                    : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20"
                                }
                                focus:outline-offset-0 transition`}
                    >
                      {pageNumberForUI}
                    </button>
                  );
                })}

                {/* Next Arrow Button */}
                <button
                  onClick={handleNext}
                  disabled={page === totalPages - 1} // Disabled on the last page index (4)
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 transition"
                >
                  <span className="sr-only">Next</span>
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.21 14.77a.75.75 0 010-1.06L10.44 10 7.21 6.29a.75.75 0 011.06-1.06l3.75 3.75a.75.75 0 010 1.06l-3.75 3.75a.75.75 0 01-1.06 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <footer className="w-full py-4 text-center text-gray-500 text-xs mt-8 border-t  border-gray-200 bg-white">
        <div className="flex justify-between items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span>Copyright © Sohclick Technology Ltd</span>
          <div>
            <Link to="/" className="mr-4 hover:underline">
              Home
            </Link>
            <a href="/privacy" className="mr-4 hover:underline">
              Privacy
            </a>
            <a href="/contact" className="mr-4 hover:underline">
              Contact Us
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Expenses;
