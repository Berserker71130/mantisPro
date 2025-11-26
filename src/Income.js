import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FiEdit, FiSearch, FiTrash2 } from "react-icons/fi";
import { IoFilter } from "react-icons/io5";
import Select from "react-select";

const Income = () => {
  const [formData, setFormData] = useState({
    customerId: "",
    noOfKg: "",
    pricePerKg: "",
    grade: "",
    category: "",
  });

  const [sales, setSales] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pageNumber, setPageNumber] = useState(0);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterAmount, setFilterAmount] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const totalPages = 5;

  const fetchCustomers = async (name) => {
    try {
      const token = localStorage.getItem("userToken");
      const response = await fetch(
        `http://localhost:3000/api/v1/customers/name-like?name=${name}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const formattedCustomers = data.map((customer) => ({
        value: customer.id,
        label: customer.name,
      }));
      setCustomers(formattedCustomers);
    } catch (err) {
      console.error("Error fetching customers:", err);
    }
  };

  const fetchSales = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("userToken");
      const pageSize = 10;
      const url = `http://localhost:3000/api/v1/income/category/SALES?page=${pageNumber}&size=${pageSize}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data && Array.isArray(data.content)) {
        setSales(data.content);
      } else {
        console.error("Fetched data is not in expected format:", data);
        setSales([]);
      }
    } catch (err) {
      setError(err.message);
      console.error("Error during sales fetch:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [pageNumber]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCustomers(searchTerm);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleNext = () => {
    if (pageNumber < 4) {
      setPageNumber(pageNumber + 1);
    }
  };

  const handlePrevious = () => {
    if (pageNumber > 0) {
      setPageNumber(pageNumber - 1);
    }
  };

  const goToPage = (newPageIndex) => {
    if (newPageIndex >= 0 && newPageIndex < totalPages) {
      setPageNumber(newPageIndex);
    }
  };

  const handleChange = (e) => {
    const { id, value } = e.target;

    let newValue = value;
    if (id === "noOfKg" || id === "pricePerKg") {
      if (value !== "") {
        newValue = parseFloat(value);
      }
    }
    setFormData((prev) => ({
      ...prev,
      [id]: newValue,
    }));
  };

  const handleCustomerChange = (selectedOption) => {
    setSelectedCustomer(selectedOption);
    setFormData((prev) => ({
      ...prev,
      customerId: selectedOption ? selectedOption.value : null,
    }));
  };

  const handleEdit = (incomeToEdit) => {
    console.log("Editing income:", incomeToEdit);
    setEditingId(incomeToEdit.id);
    setFormData({
      customerId: incomeToEdit.customerId ?? "",
      noOfKg: incomeToEdit.noOfKg ?? "",
      pricePerKg: incomeToEdit.pricePerKg ?? "",
      grade: incomeToEdit.grade ?? "",
      category: incomeToEdit.category ?? "",
    });

    const customerOption = customers.find(
      (c) => c.value === incomeToEdit.customerId
    );
    setSelectedCustomer(customerOption);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      customerId: "",
      noOfKg: "",
      pricePerKg: "",
      grade: "",
      category: "",
    });
    setSelectedCustomer(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      customerId: Number(formData.customerId),
      noOfKg: Number(formData.noOfKg),
      grade: formData.grade,
      pricePerKg: Number(formData.pricePerKg),
      category: formData.category,
    };
    if (isNaN(payload.customerId) || !payload.customerId) {
      toast.error("Customer ID must be a valid number.");
      return;
    }

    let url = "http://localhost:3000/api/v1/income";
    let method = "POST";
    if (editingId) {
      url = `http://localhost:3000/api/v1/income/${editingId}`;
      method = "PUT";
    }

    try {
      const token = localStorage.getItem("userToken");
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        toast.error(`Failed to save record. Status: ${response.status}`);
        throw new Error(`Failed to save record. Status: ${response.status}`);
      }
      await fetchSales();

      handleCancelEdit();
    } catch (error) {
      console.error("Error:", error);
      if (!error.message.includes("Status")) {
        toast.error("Failed to save record. Please try again.");
      }
    }
  };

  const handleDelete = async (idToDelete) => {
    try {
      const token = localStorage.getItem("userToken");
      const response = await fetch(
        `http://localhost:3000/api/v1/income/${idToDelete}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        toast.error(`Failed to delete. Status: ${response.status}`);
        throw new Error(`Failed to delete. Status: ${response.status}`);
      }

      await fetchSales();
      toast.success("Record deleted successfully!");
    } catch (error) {
      if (!error.message.includes("Status")) {
        toast.error("Failed to delete record. Please try again.");
      }
      toast.error("Failed to delete record");
    }
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    console.log("Applying filters:", {
      filterCustomer,
      filterAmount,
      filterDateFrom,
      filterDateTo,
    });
    toast.info(
      "Filters applied!(Note: API integration needed for functional filtering)"
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-7xl mx-auto">
        <div className="p-0">
          {/* Breadcrumb */}
          <div className="mb-8">
            <div className="text-sm text-gray-500 mb-1">
              <Link
                to="/"
                className="text-indigo-600 hover:text-indigo-800 transition"
              >
                Home
              </Link>{" "}
              <span className="mx-2 text-gray-400">&gt;</span>
              <span className="font-semibold text-gray-700 ">
                Income(Sales record)
              </span>
            </div>

            <h2 className="text-3xl font-extrabold mt-2 text-gray-900">
              Sales Record Management
            </h2>
          </div>

          {/* Form Card */}
          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-xl shadow-2xl p-8 mb-8 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">
                {editingId ? "Update Sales Record" : "Add New Sales Record"}
              </h3>

              {/* Input Fields */}
              <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
                <div>
                  <label
                    htmlFor="customerId"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Customer
                  </label>
                  <Select
                    options={customers}
                    value={selectedCustomer}
                    onChange={handleCustomerChange}
                    placeholder="Search For Customer"
                    isClearable
                    className="w-full text-sm"
                    name="customerId"
                    inputId="customerId"
                    onInputChange={(inputValue) => setSearchTerm(inputValue)}
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        borderRadius: "8px",
                        padding: "3px 0",
                        borderColor: state.isFocused ? "#4f46e5" : "#d1d5db",
                        boxShadow: state.isFocused
                          ? "0 0 0 1px #4f46e5"
                          : "none",
                        "&:hover": {
                          borderColor: state.isFocused ? "#4f46e5" : "#d1d5db",
                        },
                      }),
                      placeholder: (base) => ({
                        ...base,
                        color: "#9ca3af",
                      }),
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="noOfKg"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Quantity (Kg)
                  </label>
                  <input
                    type="number"
                    id="noOfKg"
                    name="noOfKg"
                    value={formData.noOfKg}
                    onChange={handleChange}
                    placeholder="eg., 500"
                    required
                    className="block outline-none w-full border border-gray-300 rounded-lg py-2.5 px-3 text-gray-900 placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm transition duration-150"
                  />
                </div>

                <div>
                  <label
                    htmlFor="pricePerKg"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Price Per KG (₦)
                  </label>
                  <input
                    type="number"
                    id="pricePerKg"
                    name="pricePerKg"
                    value={formData.pricePerKg}
                    onChange={handleChange}
                    placeholder="eg., 1200"
                    required
                    className="block outline-none w-full border border-gray-300 rounded-lg py-2.5 px-3 text-gray-900 placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm transition duration-150"
                  />
                </div>

                <div>
                  <label
                    htmlFor="grade"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Grade
                  </label>
                  <input
                    type="text"
                    id="grade"
                    name="grade"
                    value={formData.grade}
                    onChange={handleChange}
                    placeholder="eg., Grade 1"
                    required
                    className="block outline-none w-full border border-gray-300 rounded-lg py-2.5 px-3 text-gray-900 placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shaadow-sm transition duration-150"
                  />
                </div>

                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="block outline-none w-full border border-gray-300 rounded-lg py-2.5 px-3 text-gray-900 placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm transition duration-150"
                  >
                    <option value="">-- Select Category --</option>
                    <option value="SALES">SALES</option>
                    <option value="EXPENSE">EXPENSE</option>
                    <option value="OTHERS">OTHERS</option>
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end pt-2">
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2.5 px-6 rounded-lg transition duration-150 focus:outline-none"
                  >
                    Cancel Edit
                  </button>
                )}

                {/* Save button */}
                <button
                  type="submit"
                  className="w-60 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-lg transition duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-lg"
                >
                  {editingId ? "Update Record" : "Save Record"}
                </button>
              </div>
            </div>
          </form>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200 ">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center border-b pb-2">
              <IoFilter className="w-5 h-5 text-indigo-600 mr-2" />
              Filter Sales Records
            </h3>

            <form onSubmit={handleFilterSubmit}>
              <div className=" grid grid-cols-1 md:grid-cols-6 gap-6 items-end">
                <div>
                  {/* customer filter */}
                  <label
                    htmlFor="customer-search"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Customer
                  </label>
                  <input
                    type="text"
                    id="customer-search"
                    name="filterCustomer"
                    value={filterCustomer}
                    placeholder="Search By Customer"
                    onChange={(e) => setFilterCustomer(e.target.value)}
                    className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 text-gray-900 placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm outline-none transition duration-150"
                  />
                </div>

                {/* amount filter */}
                <div>
                  <label
                    htmlFor="amount"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Amount
                  </label>
                  <input
                    type="number"
                    id="amount"
                    name="filterAmount"
                    value={filterAmount}
                    onChange={(e) => setFilterAmount(e.target.value)}
                    placeholder="Search By Amount"
                    className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm outline-none transition duration-150"
                  />
                </div>

                {/* date from */}
                <div>
                  <label
                    htmlFor="date-from"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Date From
                  </label>
                  <input
                    type="date"
                    id="date-from"
                    name="filterDateFrom"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm outline-none"
                  />
                </div>

                {/* date to */}
                <div>
                  <label
                    htmlFor="date-to"
                    className="block text-gray-700 text-sm font-medium text-gray-700 mb-2"
                  >
                    Date To
                  </label>
                  <input
                    type="date"
                    id="date-to"
                    name="filterDateTo"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm outline-none"
                  />
                </div>

                {/* filter button */}
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-lg transition duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-md flex items-center justify-center mt-7"
                  >
                    <FiSearch className="mr-2 h-4 w-4" /> Apply Filter
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Table card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      No. Of KG
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Price Per KG
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {sales.length > 0 ? (
                    sales.map((sale, index) => (
                      <tr
                        key={sale.id}
                        className="even:bg-gray-50 hover:bg-indigo-50 transition duration-150"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {index + 1 + pageNumber * 10}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {sale.customerName}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {sale.kg ?? sale.noOfKg}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(sale.createdAt).toLocaleDateString()}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {" "}
                          ₦{sale.pricePerKg?.toLocaleString()}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {sale.grade}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                            {sale.category}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">
                          ₦{sale.amount?.toLocaleString()}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 flex items-center space-x-3">
                          <button
                            onClick={() => handleEdit(sale)}
                            title="Edit Record"
                          >
                            <FiEdit className="cursor-pointer text-indigo-600 hover:text-indigo-800 h-5 w-5 transition duration-150" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(sale.id)}
                            title="Delete Record"
                          >
                            <FiTrash2 className="cursor-pointer text-red-600 hover:text-red-800 h-5 w-5 transition duration-150" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="9"
                        className="py-10 text-center text-gray-500"
                      >
                        {isLoading ? (
                          <span className="text-indigo-600 font-medium ">
                            Loading Sales Record...
                          </span>
                        ) : (
                          "No Sales Record Found"
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-6 rounded-b-xl shadow-inner">
            <div className="flex flex-1 items-center justify-between">
              {/* Left Side: Showing Results Count */}
              <div>
                <p className="text-sm text-gray-700">
                  Showing Page{" "}
                  <span className="font-medium">{pageNumber + 1}</span> of{" "}
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
                    disabled={pageNumber === 0}
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
                    const pageIndex = index;
                    const pageNumberForUI = index + 1; // 1, 2, 3, 4, 5
                    const isActive = pageIndex === pageNumber;

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
                    disabled={pageNumber === totalPages - 1} // Disabled on the last page index (4)
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

          {/* Footer */}
          <footer className="py-4 text-center text-gray-500 text-xs mt-8 border-t border-gray-200">
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
      </div>
    </div>
  );
};

export default Income;
