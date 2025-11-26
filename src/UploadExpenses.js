import * as XLSX from "xlsx";
import { useRef, useState } from "react";
import { FiUploadCloud, FiFileText, FiXCircle } from "react-icons/fi";

const UploadExpenses = () => {
  const [excelData, setExceldata] = useState([]);
  const [fileName, setFileName] = useState("");
  const [isDragging, setisDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("idle");

  const fileInputRef = useRef(null);

  const processFile = (file) => {
    if (!file) return;

    setFileName(file.name);
    setUploadStatus("ready");

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        setExceldata(json);
        console.log("Expense data loaded from Excel:", json);
      } catch (error) {
        console.error("Error reading or parsing file:", error);
        setUploadStatus(error);
        alert(
          "Error reading or parsing the file. Please check the file format"
        );
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleImportData = () => {
    if (excelData.length === 0) {
      alert("No data loaded to import.");
      return;
    }

    setUploadStatus("uploading");
    console.log("Attempting to send Expenses data to backend API:", excelData);

    setTimeout(() => {
      setUploadStatus("success");
      alert(`Successfully processed ${excelData.length} rows of exposed data.`);
      handleClear();
    }, 2000);
  };

  const handleClear = () => {
    setFileName("");
    setExceldata([]);
    setUploadStatus("idle");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  //Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setisDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setisDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setisDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const getStatusMessage = () => {
    switch (uploadStatus) {
      case "ready":
        return `File: ${fileName}. Ready to preview and import`;
      case "uploading":
        return "Sending data to server... Please wait";
      case "success":
        return "Data successfully imported!";
      case "error":
        return "Error reading file. Please check the format.";
      default:
        return "Drag and drop your Excel file here or click to browse.";
    }
  };

  const StatusColor = (status) => {
    switch (status) {
      case "success":
        return "text-green-600 border-green-300 bg-green-50";
      case "error":
        return "text-red-600 border-red-300 bg-red-50";
      case "uploading":
        return "text-blue-600 border-blue-300 bg-blue-50";
      default:
        return "text-gray-600 border-indigo-300 bg-indigo-50";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl p-8">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-2">
          Import Expense Data
        </h1>
        <p className="text-gray-500 mb-8">From Excel (.xlsx, .xls) File</p>

        {/* File instructions and disclaimer */}
        <div className="mb-6 p-4 border-l-4 border-indigo-500 bg-indigo-50 text-indigo-700 rounded-lg">
          <p className="font-semibold">Important:</p>
          <p className="text-sm">
            Ensure your file contains required headers such as **Supplier**,
            **Amount**, **Date**, **Description** and **Category**. Only
            **.xlsx** and **.xls** formats are accepted.
          </p>
        </div>

        {/* Drag and drop zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-10 text-center transition duration-300
          ${
            isDragging
              ? "border-indigo-600 bg-indigo-100"
              : "border-gray-300 bg-white"
          }`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Invisible file input(Used by browser and drop) */}
          <input
            id="file-upload-input"
            ref={fileInputRef}
            type="file"
            className="sr-only"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
          />

          {fileName && uploadStatus !== "idle" ? (
            <div
              className={`flex items-center justify-between p-4 rounded-lg ${StatusColor(
                uploadStatus
              )}`}
            >
              <div className="flex items-center space-x-3">
                <FiFileText className="w-6 h-6" />
                <span className="font-medium truncate">{fileName}</span>
                {excelData.length > 0 && (
                  <span className="text-xs text-gray-700 font-bold">
                    ({excelData.length} records loaded)
                  </span>
                )}
              </div>
              <button
                onClick={handleClear}
                className="text-red-500 hover:text-red-700"
              >
                <FiXCircle className="w-5 h-5" />
              </button>
            </div>
          ) : (
            // DRAG DROP PROMPT VIEW
            <>
              <FiUploadCloud className="mx-auto w-12 h-12 text-gray-400 mb-3" />
              <p className="text-lg font-medium text-gray-700">
                Drag and drop your File here
              </p>
              <p className="text-sm text-gray-500  mb-4">or click to browse</p>
              <label
                htmlFor="file-upload-input"
                className="inline-flex items-center px-6 py-2  border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer transition duration-150"
              >
                Choose File
              </label>
            </>
          )}
        </div>

        {/* STATUS AND ACTION BUTTON */}
        <div className="mt-8 flex justify-between items-center">
          <p className={`font-semibold transition duration-300 text-gray-600`}>
            {getStatusMessage()}
          </p>
          <button
            onClick={handleImportData}
            disabled={excelData.length === 0 || uploadStatus === "uploading"}
            className={`
              px-8 py-3 rounded-lg font-bold text-white transition duration-300
              ${
                excelData.length > 0 && uploadStatus !== "uploading"
                  ? "bg-indigo-600 hover:bg-indigo-700 shadow-lg"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
          >
            {uploadStatus === "uploading" ? "Importing..." : "Continue Import"}
          </button>
        </div>

        {/* DATA PREVIEW */}
        {excelData.length > 0 && (
          <div className="mt-10 p-6 border rounded-xl bg-gray-50">
            <h2 className="text-xl font-bold text-indigo-700 mb-4 border-b pb-2">
              Excel Data Preview ({excelData.length} Rows)
            </h2>
            <div className="overflow-x-auto shadow-md rounded-lg border">
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    {Object.keys(excelData[0]).map((key) => (
                      <th
                        key={key}
                        className="py-3 px-4 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 bg-gray-100 tracking-wider"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {excelData.map((row, index) => (
                    <tr
                      key={index}
                      className="hover:bg-indigo-50 transition duration-150"
                    >
                      {Object.values(row).map((value, i) => (
                        <td
                          key={i}
                          className="py-2 px-4 border-b border-gray-200 text-sm text-gray-900"
                        >
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadExpenses;
