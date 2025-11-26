import { FiSearch, FiBell } from "react-icons/fi";
import { FaUserCircle } from "react-icons/fa";
import { GiPlantSeed } from "react-icons/gi";
import { useNavigate } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    navigate("/login");
  };
  return (
    <header className="bg-white p-4 sticky top-0 z-10 rounded-lg shadow-md">
      <header className="bg-white shadow py-4 px-6 flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex items-center mr-4">
            <GiPlantSeed className="text-green-500 mr-2" size={24} />
            <h2 className="text-xl font-semibold mr-4">Mantis</h2>
          </div>

          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              id="search"
              name="search"
              placeholder="Ctrl + K"
              className="bg-white border border-gray-200 rounded-md py-2 pl-10 pr-4 focus:outline-none text-sm"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <FiLogOut
            className="text-gray-600 hover:text-red-700 cursor-pointer"
            size={20}
            onClick={handleLogout}
          />

          <FiBell
            className="text-gray-600 hover:text-gray-800 cursor-pointer"
            size={20}
          />
          <FaUserCircle
            className="text-gray-600 hover:text-gray-800 cursor-pointer"
            size={20}
          />
          <span className="text-gray-700">John Doe</span>
        </div>
      </header>
    </header>
  );
};
export default Header;
