import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ThemeContext from "../../../Context/ThemeContext";
import CountUp from "react-countup";
import useAuth from "../../../../hooks/useAuth";
import coverPhoto from "../../../../assets/bg/hammer.webp";
import LoadingSpinner from "../../../LoadingSpinner";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FaUsers,
  FaGavel,
  FaDollarSign,
  FaChartLine,
  FaTicketAlt,
  FaShieldAlt,
  FaCog,
  FaEdit,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
} from "react-icons/fa";
import { RiUserStarFill } from "react-icons/ri";

const AdminProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const { isDarkMode } = useContext(ThemeContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [coverOptions, setCoverOptions] = useState([]);
  const [currentCover, setCurrentCover] = useState(coverPhoto);
  const [selectedCover, setSelectedCover] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [adminData, setAdminData] = useState({
    totalUsers: 0,
    totalSellers: 0,
    totalBuyers: 0,
    totalAuctions: 0,
    totalRevenue: 0,
  });
  const [users, setUsers] = useState([]);
  const [sellerRequests, setSellerRequests] = useState([]);
  const [quickActions, setQuickActions] = useState([]);
  const navigate = useNavigate();

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, auctionsRes, requestsRes] = await Promise.all([
          axios.get("http://localhost:5001/users"),
          axios.get("http://localhost:5001/auctions"),
          axios.get("http://localhost:5001/sellerRequest"),
        ]);

        const totalSellers = usersRes.data.filter(
          (u) => u.role === "seller"
        ).length;
        const totalBuyers = usersRes.data.filter(
          (u) => u.role === "buyer"
        ).length;

        setAdminData({
          totalUsers: usersRes.data.length,
          totalSellers,
          totalBuyers,
          totalAuctions: auctionsRes.data.length,
          totalRevenue: 32500,
        });

        setUsers(usersRes.data.slice(0, 5));
        setSellerRequests(
          requestsRes.data
            .filter((r) => r.becomeSellerStatus === "pending")
            .slice(0, 5)
        );

        // Set quick actions
        setQuickActions([
          {
            id: 1,
            icon: <FaUsers className="text-2xl text-purple-500 mb-2" />,
            label: "Manage Users",
            path: "/dashboard/users",
            bgColor: isDarkMode 
              ? "bg-gradient-to-br from-purple-900/50 to-blue-900/50 hover:from-purple-800/50 hover:to-blue-800/50" 
              : "bg-gradient-to-br from-purple-100 to-blue-50 hover:from-purple-200 hover:to-blue-100",
          },
          {
            id: 2,
            icon: <FaGavel className="text-2xl text-purple-500 mb-2" />,
            label: "Manage Auctions",
            path: "/dashboard/auctions",
            bgColor: isDarkMode 
              ? "bg-gradient-to-br from-blue-900/50 to-cyan-900/50 hover:from-blue-800/50 hover:to-cyan-800/50" 
              : "bg-gradient-to-br from-blue-100 to-cyan-50 hover:from-blue-200 hover:to-cyan-100",
          },
          {
            id: 3,
            icon: <RiUserStarFill className="text-2xl text-purple-500 mb-2" />,
            label: "Seller Requests",
            path: "/dashboard/seller-requests",
            bgColor: isDarkMode 
              ? "bg-gradient-to-br from-cyan-900/50 to-teal-900/50 hover:from-cyan-800/50 hover:to-teal-800/50" 
              : "bg-gradient-to-br from-cyan-100 to-teal-50 hover:from-cyan-200 hover:to-teal-100",
          },
          {
            id: 4,
            icon: <FaShieldAlt className="text-2xl text-purple-500 mb-2" />,
            label: "Security",
            path: "/dashboard/security",
            bgColor: isDarkMode 
              ? "bg-gradient-to-br from-teal-900/50 to-emerald-900/50 hover:from-teal-800/50 hover:to-emerald-800/50" 
              : "bg-gradient-to-br from-teal-100 to-emerald-50 hover:from-teal-200 hover:to-emerald-100",
          },
        ]);

        // Mock cover options
        setCoverOptions([
          { id: 1, image: coverPhoto },
          { id: 2, image: "https://i.ibb.co/KSCtW5n/download-2.jpg" },
          { id: 3, image: "https://i.ibb.co/60Q0GGYP/download-3.jpg" },
          { id: 4, image: "https://i.ibb.co/RGwFXk1S/download-4.jpg" },
        ]);

        setCurrentCover(coverPhoto);
      } catch (error) {
        console.error("Error fetching data:", error);
        // Fallback data
        setAdminData({
          totalUsers: 1243,
          totalSellers: 342,
          totalBuyers: 901,
          totalAuctions: 567,
          totalRevenue: 32500,
        });
      }
    };

    fetchData();
  }, [user, isDarkMode]);

  const saveCoverImage = async () => {
    if (!selectedCover || !user?.uid) return;
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCurrentCover(selectedCover);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving cover image:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const boxStyle = `rounded-xl shadow-lg ${
    isDarkMode
      ? "bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-200"
      : "bg-white border-gray-200 hover:bg-gray-50 text-gray-800"
  } transition-all duration-300`;

  const cardTitleStyle = `text-lg font-semibold mb-4 ${
    isDarkMode ? "text-gray-200" : "text-gray-700"
  }`;

  const textMutedStyle = isDarkMode ? "text-gray-400" : "text-gray-500";

  if (authLoading) return <LoadingSpinner />;

  return (
    <div
      className={`min-h-screen ${
        isDarkMode ? "bg-gray-900" : "bg-purple-50"
      } transition-all duration-300 p-4 md:p-8`}
    >
      {/* Profile Banner with Purple Overlay */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative h-[300px] md:h-[350px] bg-cover bg-center rounded-2xl overflow-hidden shadow-xl"
        style={{
          backgroundImage: `linear-gradient(rgba(109, 40, 217, 0.7), rgba(76, 29, 149, 0.7)), url(${currentCover})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-6 flex flex-col items-center gap-4">
            <motion.img
              src={user?.photoURL || "https://i.imgur.com/8Km9tLL.png"}
              alt={user?.displayName || "Admin"}
              className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Welcome Back, {user?.displayName?.split(" ")[0] || "Admin"}!
            </h1>
            <p className="text-purple-100 max-w-2xl mx-auto">
              Here's what's happening with your marketplace today.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="absolute right-4 top-4 bg-white/90 text-purple-800 hover:bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transition-all hover:scale-105"
        >
          <FaEdit className="text-purple-600" />
          <span className="font-medium">Edit Cover</span>
        </button>
      </motion.div>

      {/* Cover Image Modal */}
      {isModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/70 flex justify-center items-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className={`${
              isDarkMode ? "bg-gray-800" : "bg-white"
            } p-6 rounded-2xl w-full max-w-4xl shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2
                className={`text-2xl font-bold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Choose Your Cover Image
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className={`p-2 rounded-full ${
                  isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                } transition-colors`}
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {coverOptions.map((cover) => (
                <motion.div
                  key={cover.id}
                  whileHover={{ scale: 1.03 }}
                  className={`cursor-pointer rounded-lg overflow-hidden transition-all ${
                    selectedCover === cover.image
                      ? "ring-4 ring-purple-500"
                      : "ring-1 ring-gray-300 dark:ring-gray-600"
                  }`}
                  onClick={() => setSelectedCover(cover.image)}
                >
                  <img
                    src={cover.image}
                    alt={`Cover ${cover.id}`}
                    className="w-full h-40 object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = coverPhoto;
                    }}
                  />
                </motion.div>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className={`px-5 py-2 rounded-lg font-medium transition-all ${
                  isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={saveCoverImage}
                disabled={!selectedCover || isSaving}
                className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
              >
                {isSaving ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Quick Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 my-8 max-w-7xl mx-auto"
      >
        {/* Total Users */}
        <motion.div
          whileHover={{ y: -5 }}
          className={`rounded-xl shadow-md overflow-hidden ${boxStyle}`}
        >
          <div className="p-6 flex items-start justify-between">
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? "text-purple-300" : "text-purple-600"}`}>
                Total Users
              </p>
              <h3 className={`text-3xl font-bold mt-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                <CountUp end={adminData.totalUsers} duration={2} />
              </h3>
              <p className={`text-xs mt-1 ${textMutedStyle}`}>
                {adminData.totalSellers} sellers, {adminData.totalBuyers} buyers
              </p>
            </div>
            <div
              className={`p-3 rounded-lg ${
                isDarkMode ? "bg-purple-900/50" : "bg-purple-100"
              }`}
            >
              <FaUsers className="text-2xl text-purple-500" />
            </div>
          </div>
          <div
            className={`h-1 bg-gradient-to-r from-purple-500 to-blue-500 ${
              isDarkMode ? "opacity-70" : "opacity-90"
            }`}
          ></div>
        </motion.div>

        {/* Total Revenue */}
        <motion.div
          whileHover={{ y: -5 }}
          className={`rounded-xl shadow-md overflow-hidden ${boxStyle}`}
        >
          <div className="p-6 flex items-start justify-between">
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? "text-purple-300" : "text-purple-600"}`}>
                Total Revenue
              </p>
              <h3 className={`text-3xl font-bold mt-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                $
                <CountUp
                  end={adminData.totalRevenue}
                  duration={2}
                  separator=","
                />
              </h3>
              <p className={`text-xs mt-1 ${textMutedStyle}`}>
                Lifetime earnings
              </p>
            </div>
            <div
              className={`p-3 rounded-lg ${
                isDarkMode ? "bg-purple-900/50" : "bg-purple-100"
              }`}
            >
              <FaDollarSign className="text-2xl text-purple-500" />
            </div>
          </div>
          <div
            className={`h-1 bg-gradient-to-r from-green-500 to-teal-500 ${
              isDarkMode ? "opacity-70" : "opacity-90"
            }`}
          ></div>
        </motion.div>

        {/* Active Auctions */}
        <motion.div
          whileHover={{ y: -5 }}
          className={`rounded-xl shadow-md overflow-hidden ${boxStyle}`}
        >
          <div className="p-6 flex items-start justify-between">
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? "text-purple-300" : "text-purple-600"}`}>
                Total Auctions
              </p>
              <h3 className={`text-3xl font-bold mt-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                <CountUp end={adminData.totalAuctions} duration={2} />
              </h3>
              <p className={`text-xs mt-1 ${textMutedStyle}`}>
                Active and completed
              </p>
            </div>
            <div
              className={`p-3 rounded-lg ${
                isDarkMode ? "bg-purple-900/50" : "bg-purple-100"
              }`}
            >
              <FaGavel className="text-2xl text-purple-500" />
            </div>
          </div>
          <div
            className={`h-1 bg-gradient-to-r from-yellow-500 to-orange-500 ${
              isDarkMode ? "opacity-70" : "opacity-90"
            }`}
          ></div>
        </motion.div>

        {/* Pending Requests */}
        <motion.div
          whileHover={{ y: -5 }}
          className={`rounded-xl shadow-md overflow-hidden ${boxStyle}`}
        >
          <div className="p-6 flex items-start justify-between">
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? "text-purple-300" : "text-purple-600"}`}>
                Pending Requests
              </p>
              <h3 className={`text-3xl font-bold mt-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                <CountUp end={sellerRequests.length} duration={2} />
              </h3>
              <p className={`text-xs mt-1 ${textMutedStyle}`}>
                Requires your attention
              </p>
            </div>
            <div
              className={`p-3 rounded-lg ${
                isDarkMode ? "bg-purple-900/50" : "bg-purple-100"
              }`}
            >
              <RiUserStarFill className="text-2xl text-purple-500" />
            </div>
          </div>
          <div
            className={`h-1 bg-gradient-to-r from-red-500 to-pink-500 ${
              isDarkMode ? "opacity-70" : "opacity-90"
            }`}
          ></div>
        </motion.div>
      </motion.div>

      {/* Main Dashboard Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {/* Left Column - Quick Actions */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className={boxStyle}
          >
            <div className={`p-6 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
              <h2 className={`text-xl font-bold flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                <FaCog className="text-purple-500" />
                Quick Actions
              </h2>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <motion.button
                  key={action.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(action.path)}
                  className={`p-4 rounded-lg flex flex-col items-center justify-center ${action.bgColor} transition-all`}
                >
                  <div className="text-purple-500">{action.icon}</div>
                  <span className={`text-sm font-medium mt-1 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
                    {action.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Column - Two Sections */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Seller Requests */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className={boxStyle}
          >
            <div className={`p-6 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"} flex justify-between items-center`}>
              <h2 className={`text-xl font-bold flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                <RiUserStarFill className="text-purple-500" />
                Pending Seller Requests
                {sellerRequests.length > 0 && (
                  <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 text-xs font-bold rounded-full">
                    {sellerRequests.length} New
                  </span>
                )}
              </h2>
              <button
                onClick={() => navigate("/dashboard/sellerRequest")}
                className="text-sm text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
              >
                View All
              </button>
            </div>
            <div className="p-6">
              {sellerRequests.length === 0 ? (
                <div className="text-center py-8">
                  <RiUserStarFill className={`mx-auto text-4xl ${isDarkMode ? "text-purple-700" : "text-purple-300"} mb-4`} />
                  <h3 className={`text-lg font-medium ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>
                    No pending seller requests
                  </h3>
                  <p className={`text-sm ${textMutedStyle} mt-1`}>
                    All requests have been processed
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sellerRequests.map((request) => (
                    <motion.div
                      key={request._id}
                      whileHover={{ scale: 1.01 }}
                      className={`p-4 rounded-lg flex items-center justify-between ${
                        isDarkMode ? "bg-gray-700/50" : "bg-purple-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-3 rounded-full ${
                            isDarkMode ? "bg-gray-600" : "bg-purple-100"
                          }`}
                        >
                          <RiUserStarFill className="text-purple-500" />
                        </div>
                        <div>
                          <h4 className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>{request.name}</h4>
                          <p className={`text-xs ${textMutedStyle}`}>
                            {request.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 transition-colors"
                          title="Approve"
                        >
                          <FaCheckCircle />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors"
                          title="Reject"
                        >
                          <FaTimesCircle />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Recent Users */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className={boxStyle}
          >
            <div className={`p-6 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"} flex justify-between items-center`}>
              <h2 className={`text-xl font-bold flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                <FaUsers className="text-purple-500" />
                Recent Users
              </h2>
              <button
                onClick={() => navigate("/dashboard/userManagement")}
                className="text-sm text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
              >
                View All
              </button>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`text-left ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                      <th className="pb-3 font-medium">User</th>
                      <th className="pb-3 font-medium">Role</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                    {users.map((user) => (
                      <motion.tr
                        key={user._id}
                        whileHover={{
                          backgroundColor: isDarkMode
                            ? "rgba(76, 29, 149, 0.2)"
                            : "rgba(216, 180, 254, 0.2)",
                        }}
                        className="transition-colors"
                      >
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={user.photo}
                              alt={user.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div>
                              <p className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>{user.name}</p>
                              <p className={`text-xs ${textMutedStyle}`}>{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className={`py-3 capitalize ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>{user.role}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.status === "active"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                            }`}
                          >
                            {user.status || "active"}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* System Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className={`${boxStyle} mt-8 max-w-7xl mx-auto`}
      >
        <div className={`p-6 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"} flex justify-between items-center`}>
          <h2 className={`text-xl font-bold flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            <FaShieldAlt className="text-purple-500" />
            System Status
          </h2>
          <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-sm font-medium rounded-full">
            All Systems Operational
          </span>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-full ${
                isDarkMode ? "bg-purple-900/50" : "bg-purple-100"
              }`}
            >
              <FaChartLine className="text-purple-500 text-xl" />
            </div>
            <div>
              <h4 className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>Performance</h4>
              <p className={`text-sm ${textMutedStyle}`}>
                Excellent (99.9% uptime)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-full ${
                isDarkMode ? "bg-purple-900/50" : "bg-purple-100"
              }`}
            >
              <FaTicketAlt className="text-purple-500 text-xl" />
            </div>
            <div>
              <h4 className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>Support Tickets</h4>
              <p className={`text-sm ${textMutedStyle}`}>
                5 open tickets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-full ${
                isDarkMode ? "bg-purple-900/50" : "bg-purple-100"
              }`}
            >
              <FaHourglassHalf className="text-purple-500 text-xl" />
            </div>
            <div>
              <h4 className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>Pending Tasks</h4>
              <p className={`text-sm ${textMutedStyle}`}>
                {sellerRequests.length} requests to review
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminProfile;