import { useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ThemeContext from "../../../Context/ThemeContext";
import CountUp from "react-countup";
import useAuth from "../../../../hooks/useAuth";
import coverPhoto from "../../../../assets/bg/hammer.webp";
import LoadingSpinner from "../../../LoadingSpinner";
import axios from "axios";
import ManageCard from "../ManageCard";
import { motion, AnimatePresence } from "framer-motion";
import { FaGavel, FaStar, FaWallet, FaMoneyCheckAlt, FaShoppingBag, FaChartLine } from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts";
import Swal from "sweetalert2";

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

// Constants
const PLATFORM_FEE = 0.05; // 5% platform fee
const SELLER_SHARE = 1 - PLATFORM_FEE; // 95%

// Error Messages
const ERROR_MESSAGES = {
  FETCH_AUCTIONS: "Failed to load auctions. Please refresh the page.",
  FETCH_PAYMENTS: "Failed to load payment history. Please try again later.",
  FETCH_STATS: "Failed to load seller statistics.",
  SAVE_COVER: "Failed to save cover image. Please try again.",
  FETCH_COVER: "Failed to load cover options.",
};

const SellerProfile = () => {
  const { user, loading: authLoading, dbUser } = useAuth();
  const { isDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();

  // State Management
  const [activeTab, setActiveTab] = useState("overview");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [coverOptions, setCoverOptions] = useState([]);
  const [currentCover, setCurrentCover] = useState(coverPhoto);
  const [selectedCover, setSelectedCover] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Data States
  const [payments, setPayments] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [sellerStats, setSellerStats] = useState({
    totalAuctions: 0,
    totalSold: 0,
    totalBids: 0,
    activeAuctions: 0,
    totalViews: 0,
    averageRating: 0,
    reviewCount: 0
  });

  // Loading states
  const [loadingStates, setLoadingStates] = useState({
    payments: false,
    auctions: false,
    cover: false,
    stats: false
  });

  // Error states
  const [errors, setErrors] = useState({
    payments: null,
    auctions: null,
    cover: null,
    stats: null
  });

  // Update loading state helper
  const setLoading = (key, value) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  };

  // Update error state helper
  const setError = (key, value) => {
    setErrors(prev => ({ ...prev, [key]: value }));
  };

  // Fetch seller statistics
  const fetchSellerStats = useCallback(async () => {
    if (!user?.email) return;

    setLoading("stats", true);
    setError("stats", null);

    try {
      // Get all seller auctions
      const auctionsResponse = await axios.get(`${API_BASE_URL}/auctions`, {
        params: { sellerEmail: user.email }
      });
      
      const sellerAuctions = auctionsResponse.data || [];
      const now = new Date();

      // Calculate auction stats
      const activeAuctions = sellerAuctions.filter(a => 
        new Date(a.endTime) > now && a.status !== "ended"
      ).length;

      const soldAuctions = sellerAuctions.filter(a => 
        a.status === "sold" || a.isSold === true || 
        (new Date(a.endTime) < now && a.bids?.length > 0)
      ).length;

      // Calculate total bids on seller's auctions
      const totalBids = sellerAuctions.reduce((sum, auction) => 
        sum + (auction.bids?.length || 0), 0
      );

      // Calculate total views (if you track views)
      const totalViews = sellerAuctions.reduce((sum, auction) => 
        sum + (auction.views || 0), 0
      );

      setSellerStats({
        totalAuctions: sellerAuctions.length,
        totalSold: soldAuctions,
        totalBids,
        activeAuctions,
        totalViews,
        averageRating: 4.7, // This should come from reviews collection
        reviewCount: 0 // This should come from reviews collection
      });

    } catch (error) {
      console.error("Error fetching seller stats:", error);
      setError("stats", ERROR_MESSAGES.FETCH_STATS);
    } finally {
      setLoading("stats", false);
    }
  }, [user]);

  // Fetch auctions for seller
  const fetchAuctions = useCallback(async () => {
    if (!user?.email) return;
    
    setLoading("auctions", true);
    setError("auctions", null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/auctions`, {
        params: { 
          sellerEmail: user.email,
          limit: 5,
          sort: '-createdAt'
        }
      });
      
      setAuctions(response.data || []);
    } catch (err) {
      console.error("Error fetching auctions:", err);
      setError("auctions", ERROR_MESSAGES.FETCH_AUCTIONS);
    } finally {
      setLoading("auctions", false);
    }
  }, [user]);

  // Fetch seller payments - USING email === paymentData.sellerEmail
  const fetchSellerPayments = useCallback(async () => {
    if (!user?.email) return;

    setLoading("payments", true);
    setError("payments", null);

    try {
      // Fetch all payments from SSLComCollection (paymentsWithSSL)
      const response = await axios.get(`${API_BASE_URL}/payments`);
      const allPayments = response.data || [];
      
      console.log("Total payments fetched:", allPayments.length);
      
      // Filter payments where sellerEmail matches logged-in user's email
      // Check multiple possible fields where seller email might be stored
      const sellerPayments = allPayments.filter(payment => {
        // Check various possible fields for seller email
        const matchesSellerEmail = 
          payment.sellerEmail === user.email ||
          payment.sellerInfo?.email === user.email ||
          payment.seller?.email === user.email;
        
        // Also check if payment is linked to seller's auctions
        // This is a fallback in case sellerEmail is not directly stored in payment
        const auctionId = payment.auctionId;
        const auction = auctions.find(a => a._id?.toString() === auctionId?.toString());
        const matchesAuctionSeller = auction?.sellerEmail === user.email;
        
        return matchesSellerEmail || matchesAuctionSeller;
      });
      
      console.log("Seller payments after filtering:", sellerPayments.length);
      
      // Sort by date (newest first)
      const sortedPayments = sellerPayments.sort((a, b) => {
        const dateA = new Date(a.paymentDate || a.createdAt || 0);
        const dateB = new Date(b.paymentDate || b.createdAt || 0);
        return dateB - dateA;
      });
      
      setPayments(sortedPayments);
      
    } catch (err) {
      console.error("Error fetching seller payments:", err);
      setError("payments", ERROR_MESSAGES.FETCH_PAYMENTS);
      
      // Try alternative endpoint if available
      try {
        console.log("Attempting alternative endpoint: /api/payments");
        const altResponse = await axios.get(`${API_BASE_URL}/api/payments`);
        const altPayments = altResponse.data?.payments || altResponse.data || [];
        
        const altSellerPayments = altPayments.filter(payment => 
          payment.sellerEmail === user.email ||
          payment.sellerInfo?.email === user.email ||
          payment.seller?.email === user.email
        );
        
        setPayments(altSellerPayments);
      } catch (altErr) {
        console.error("Alternative payment fetch also failed:", altErr);
      }
    } finally {
      setLoading("payments", false);
    }
  }, [user, auctions]);

  // Fetch cover options and user cover
  const fetchCoverData = useCallback(async () => {
    setLoading("cover", true);
    setError("cover", null);
    
    try {
      // Fetch cover options
      const optionsResponse = await axios.get(`${API_BASE_URL}/cover-options`);
      setCoverOptions(optionsResponse.data);
    } catch (error) {
      console.error("Error fetching cover options:", error);
      setError("cover", ERROR_MESSAGES.FETCH_COVER);
      // Set fallback cover options
      setCoverOptions([
        { id: 1, image: coverPhoto },
        { id: 2, image: "https://images.unsplash.com/photo-1557683316-973673baf926?w=1200" },
        { id: 3, image: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1200" },
        { id: 4, image: "https://images.unsplash.com/photo-1557683311-eac922347aa1?w=1200" },
      ]);
    }

    // Fetch user's current cover - using user collection
    if (user?.email) {
      try {
        const userResponse = await axios.get(`${API_BASE_URL}/users`, {
          params: { email: user.email }
        });
        const userData = userResponse.data[0];
        if (userData?.coverImage) {
          setCurrentCover(userData.coverImage);
        }
      } catch (error) {
        console.error("Error fetching user cover:", error);
        // Keep default cover
      }
    }
    
    setLoading("cover", false);
  }, [user]);

  // Initial data fetch
  useEffect(() => {
    if (user?.email) {
      fetchAuctions();
      fetchSellerStats();
      fetchCoverData();
    }
  }, [user, fetchAuctions, fetchSellerStats, fetchCoverData]);

  // Fetch payments when auctions are loaded and user is seller
  useEffect(() => {
    if (user?.email && dbUser?.role === "seller" && auctions.length > 0) {
      fetchSellerPayments();
    }
  }, [user, dbUser?.role, auctions, fetchSellerPayments]);

  // Calculate earnings and net profit - Memoized for performance
  const earnings = useMemo(() => {
    const completedPayments = payments.filter(
      payment => payment.status === "completed" || 
                payment.status === "succeeded" || 
                payment.PaymentStatus === "success"
    );

    const pendingPayments = payments.filter(
      payment => payment.status === "pending" || 
                payment.status === "processing" || 
                payment.PaymentStatus === "pending"
    );

    const totalGross = completedPayments.reduce((sum, payment) => {
      return sum + (payment.amount || payment.price || 0);
    }, 0);

    const pendingGross = pendingPayments.reduce((sum, payment) => {
      return sum + (payment.amount || payment.price || 0);
    }, 0);

    const totalNetProfit = totalGross * SELLER_SHARE;
    const totalPlatformFee = totalGross * PLATFORM_FEE;
    const pendingNetProfit = pendingGross * SELLER_SHARE;

    return {
      totalGross,
      totalNetProfit,
      totalPlatformFee,
      pendingGross,
      pendingNetProfit,
      completedCount: completedPayments.length,
      pendingCount: pendingPayments.length
    };
  }, [payments]);

  // Prepare chart data for auction activity - Memoized
  const chartData = useMemo(() => {
    if (!auctions.length) return [];

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const recentAuctions = auctions.filter(a => new Date(a.createdAt) >= last30Days);
    
    if (recentAuctions.length === 0) return [];

    const chartDataMap = new Map();

    recentAuctions.forEach(auction => {
      const date = new Date(auction.createdAt).toLocaleDateString();
      chartDataMap.set(date, (chartDataMap.get(date) || 0) + 1);
    });

    return Array.from(chartDataMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-7); // Last 7 days
  }, [auctions]);

  // Save cover image
  const saveCoverImage = async () => {
    if (!selectedCover || !user?.email) {
      Swal.fire({
        icon: 'warning',
        title: 'No Cover Selected',
        text: 'Please select a cover image first.',
      });
      return;
    }

    setIsSaving(true);
    setError("cover", null);

    try {
      // Update user's cover image in users collection
      await axios.patch(`${API_BASE_URL}/user/${user.email}`, {
        coverImage: selectedCover,
      });

      setCurrentCover(selectedCover);
      setIsModalOpen(false);
      
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Cover image updated successfully.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error("Error saving cover image:", error);
      setError("cover", ERROR_MESSAGES.SAVE_COVER);
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: ERROR_MESSAGES.SAVE_COVER,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Theme styles
  const boxStyle = `border rounded-xl shadow-lg ${
    isDarkMode
      ? "bg-gray-800 border-gray-700 hover:bg-gray-700"
      : "bg-white border-gray-200 hover:bg-gray-50"
  } transition-all duration-300`;

  const titleStyle = `text-2xl font-bold ${
    isDarkMode ? "text-white" : "text-gray-900"
  }`;

  const labelStyle = `text-sm ${
    isDarkMode ? "text-gray-300" : "text-gray-600"
  }`;

  if (authLoading) return <LoadingSpinner />;

  return (
    <div
      className={`min-h-screen ${
        isDarkMode
          ? "bg-gradient-to-b from-gray-900 to-gray-800 text-white"
          : "bg-gradient-to-b from-purple-50 to-indigo-50 text-gray-800"
      } transition-all duration-300 p-4 md:p-8`}
    >
      {/* Profile Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative h-[350px] bg-cover bg-center rounded-2xl overflow-hidden shadow-xl"
        style={{
          backgroundImage: `url(${currentCover})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black opacity-40"></div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="absolute right-4 top-4 bg-white text-gray-800 hover:bg-gray-100 px-4 py-2 rounded-full border border-gray-200 text-sm font-semibold flex items-center shadow-md disabled:opacity-50"
          disabled={loadingStates.cover}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="mr-2"
          >
            <path
              d="M15.2322 5.23223L18.7677 8.76777M16.7322 3.73223C17.7085 2.75592 19.2914 2.75592 20.2677 3.73223C21.244 4.70854 21.244 6.29146 20.2677 7.26777L6.5 21.0355H3V17.4644L16.7322 3.73223Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {loadingStates.cover ? "Loading..." : "Edit Cover"}
        </button>
      </motion.div>

      {/* Cover Image Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black bg-opacity-75 flex justify-center items-center p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`${
                isDarkMode ? "bg-gray-800" : "bg-white"
              } p-8 rounded-2xl w-full max-w-5xl shadow-2xl max-h-[90vh] overflow-y-auto`}
              onClick={e => e.stopPropagation()}
            >
              <h2
                className={`text-2xl font-bold text-center mb-6 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Choose Your Cover Image
              </h2>
              
              {errors.cover && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                  {errors.cover}
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {coverOptions.map((cover) => (
                  <motion.div
                    key={cover.id}
                    whileHover={{ scale: 1.05 }}
                    className={`cursor-pointer border-4 rounded-lg transition-all ${
                      selectedCover === cover.image
                        ? "border-purple-500"
                        : "border-transparent hover:border-purple-300"
                    }`}
                    onClick={() => setSelectedCover(cover.image)}
                  >
                    <img
                      src={cover.image}
                      alt={`Cover ${cover.id}`}
                      className="w-full h-40 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.src = coverPhoto;
                      }}
                      loading="lazy"
                    />
                  </motion.div>
                ))}
              </div>

              <div className="flex justify-end mt-8 space-x-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className={`px-6 py-2 rounded-full ${
                    isDarkMode
                      ? "bg-gray-700 text-white hover:bg-gray-600"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  } font-semibold disabled:opacity-50`}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={saveCoverImage}
                  className={`px-6 py-2 rounded-full ${
                    isSaving
                      ? "bg-purple-400 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-700"
                  } text-white font-semibold disabled:opacity-50 flex items-center gap-2`}
                  disabled={isSaving || !selectedCover}
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    "Save Cover"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="px-6 -mt-20 mb-8"
      >
        <div
          className={`flex flex-col md:flex-row items-center gap-6 ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          <div className="relative flex-shrink-0">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className={`w-32 h-32 rounded-full border-4 ${
                isDarkMode
                  ? "border-gray-700 bg-gray-800"
                  : "border-white bg-gray-200"
              } overflow-hidden shadow-lg`}
            >
              <img
                src={
                  user?.photoURL ||
                  "https://img.freepik.com/premium-vector/flat-businessman-character_33040-132.jpg"
                }
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "https://img.freepik.com/premium-vector/flat-businessman-character_33040-132.jpg";
                }}
                loading="lazy"
              />
            </motion.div>
          </div>
          
          <div className="lg:text-left text-center w-full">
            <h1 className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              {user?.displayName || "No name"}
            </h1>
            
            <p className={`text-gray-400 ${isDarkMode ? "text-gray-300" : "text-gray-600"} mt-2`}>
              Email: {user?.email || "No email"}
              {dbUser?.location && <span> • Location: {dbUser.location}</span>}
              {dbUser?.memberSince && <span> • Member Since: {dbUser.memberSince}</span>}
            </p>

            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-4 flex-wrap">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className={`px-4 py-2 text-sm border rounded-full font-semibold ${
                    isDarkMode
                      ? "border-gray-600 bg-gray-700 text-white hover:bg-gray-600"
                      : "border-gray-300 bg-white text-gray-800 hover:bg-gray-100"
                  } shadow-md`}
                >
                  Edit Profile
                </motion.button>
                
                {dbUser?.role && (
                  <span
                    className={`text-xs font-semibold px-4 py-1 rounded-full capitalize ${
                      dbUser.role === "seller" ? "bg-blue-600 text-white" : "bg-gray-600 text-white"
                    }`}
                  >
                    {dbUser.role}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <FaStar className="text-yellow-400" />
                <span className="text-sm">{sellerStats.averageRating.toFixed(1)} ({sellerStats.reviewCount} reviews)</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Seller Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className={`${boxStyle} mb-8`}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className={titleStyle}>Seller Dashboard</h2>
        </div>

        {loadingStates.stats ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : errors.stats ? (
          <div className="p-12 text-center">
            <p className="text-red-500 mb-4">{errors.stats}</p>
            <button
              onClick={fetchSellerStats}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className={`p-6 rounded-xl shadow-md ${
                isDarkMode
                  ? "bg-gradient-to-r from-blue-900 to-blue-700"
                  : "bg-gradient-to-r from-blue-100 to-blue-200"
              } flex items-center gap-4`}
            >
              <FaGavel className="text-3xl text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold">Total Auctions</h3>
                <p className="text-2xl font-bold">
                  <CountUp end={sellerStats.totalAuctions} duration={2} />
                </p>
                <p className="text-xs opacity-75">
                  {sellerStats.activeAuctions} active
                </p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className={`p-6 rounded-xl shadow-md ${
                isDarkMode
                  ? "bg-gradient-to-r from-green-900 to-green-700"
                  : "bg-gradient-to-r from-green-100 to-green-200"
              } flex items-center gap-4`}
            >
              <FaShoppingBag className="text-3xl text-green-500" />
              <div>
                <h3 className="text-lg font-semibold">Items Sold</h3>
                <p className="text-2xl font-bold">
                  <CountUp end={sellerStats.totalSold} duration={2} />
                </p>
                <p className="text-xs opacity-75">
                  {earnings.completedCount} paid
                </p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className={`p-6 rounded-xl shadow-md ${
                isDarkMode
                  ? "bg-gradient-to-r from-yellow-900 to-yellow-700"
                  : "bg-gradient-to-r from-yellow-100 to-yellow-200"
              } flex items-center gap-4`}
            >
              <FaChartLine className="text-3xl text-yellow-500" />
              <div>
                <h3 className="text-lg font-semibold">Total Bids</h3>
                <p className="text-2xl font-bold">
                  <CountUp end={sellerStats.totalBids} duration={2} />
                </p>
                <p className="text-xs opacity-75">
                  {sellerStats.totalViews} views
                </p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className={`p-6 rounded-xl shadow-md ${
                isDarkMode
                  ? "bg-gradient-to-r from-purple-900 to-purple-700"
                  : "bg-gradient-to-r from-purple-100 to-purple-200"
              } flex items-center gap-4`}
            >
              <FaMoneyCheckAlt className="text-3xl text-purple-500" />
              <div>
                <h3 className="text-lg font-semibold">Net Profit (95%)</h3>
                {loadingStates.payments ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm">Loading...</span>
                  </div>
                ) : errors.payments ? (
                  <p className="text-red-500 text-sm">{errors.payments}</p>
                ) : (
                  <>
                    <p className="text-2xl font-bold">
                      $<CountUp end={earnings.totalNetProfit} decimals={2} duration={2} />
                    </p>
                    <p className="text-xs opacity-75">
                      From {earnings.completedCount} payments
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>

      {/* Seller Tools */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className={`${boxStyle} mb-8`}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className={titleStyle}>Your Activity</h2>
          
          <div className="flex flex-wrap gap-2 mt-4">
            {["overview", "auctions", "payments"].map((tab) => (
              <motion.button
                key={tab}
                whileHover={{ scale: 1.05 }}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  activeTab === tab
                    ? "bg-purple-600 text-white"
                    : isDarkMode
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-xl font-semibold mb-4">Auction Trends (Last 7 Days)</h3>
                
                <div
                  className={`${
                    isDarkMode ? "bg-gray-800" : "bg-white"
                  } p-6 rounded-xl shadow-md`}
                >
                  {loadingStates.auctions ? (
                    <div className="h-[350px] flex items-center justify-center">
                      <LoadingSpinner />
                    </div>
                  ) : chartData.length === 0 ? (
                    <div className="h-[350px] flex items-center justify-center">
                      <p className="text-gray-500">No auction activity in the last 30 days</p>
                    </div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart
                          data={chartData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <defs>
                            <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#6D28D9" stopOpacity={1} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={isDarkMode ? "#4B5563" : "#E5E7EB"}
                          />
                          <XAxis
                            dataKey="date"
                            tick={{ fill: isDarkMode ? "#E5E7EB" : "#4B5563" }}
                            axisLine={{ stroke: isDarkMode ? "#6B7280" : "#D1D5DB" }}
                          />
                          <YAxis
                            tick={{ fill: isDarkMode ? "#E5E7EB" : "#4B5563" }}
                            axisLine={{ stroke: isDarkMode ? "#6B7280" : "#D1D5DB" }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
                              border: `1px solid ${isDarkMode ? "#374151" : "#E5E7EB"}`,
                              borderRadius: "0.5rem",
                              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                            }}
                            itemStyle={{ color: isDarkMode ? "#E5E7EB" : "#111827" }}
                            labelStyle={{ fontWeight: "bold" }}
                          />
                          <Legend
                            wrapperStyle={{
                              paddingTop: "20px",
                              color: isDarkMode ? "#E5E7EB" : "#4B5563",
                            }}
                          />
                          <Bar
                            dataKey="count"
                            name="Auctions Created"
                            fill="url(#colorBar)"
                            radius={[4, 4, 0, 0]}
                            animationDuration={2000}
                          >
                            {chartData.map((_, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  index % 3 === 0
                                    ? "#F59E0B"
                                    : index % 3 === 1
                                    ? "#10B981"
                                    : "#EF4444"
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>

                      {/* Stats summary */}
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                          <p className="text-sm font-medium">Total Auctions</p>
                          <p className="text-2xl font-bold">{sellerStats.totalAuctions}</p>
                        </div>
                        <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                          <p className="text-sm font-medium">Items Sold</p>
                          <p className="text-2xl font-bold">{sellerStats.totalSold}</p>
                        </div>
                        <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                          <p className="text-sm font-medium">Net Profit</p>
                          <p className="text-2xl font-bold">${earnings.totalNetProfit.toFixed(2)}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "auctions" && (
              <motion.div
                key="auctions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold">Your Recent Auctions</h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => navigate("/dashboard/manage-auctions")}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                  >
                    View All
                  </motion.button>
                </div>

                {loadingStates.auctions ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : errors.auctions ? (
                  <div className="text-center py-8">
                    <p className="text-red-500 mb-4">{errors.auctions}</p>
                    <button
                      onClick={fetchAuctions}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm"
                    >
                      Retry
                    </button>
                  </div>
                ) : auctions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No auctions found.</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      onClick={() => navigate("/dashboard/create-auction")}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full text-sm"
                    >
                      Create Your First Auction
                    </motion.button>
                  </div>
                ) : (
                  <ManageCard auctions={auctions} />
                )}
              </motion.div>
            )}

            {activeTab === "payments" && (
              <motion.div
                key="payments"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold">Payment History</h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => navigate("/dashboard/payments")}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                  >
                    View All
                  </motion.button>
                </div>

                {loadingStates.payments ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : errors.payments ? (
                  <div className="text-center py-8">
                    <p className="text-red-500 mb-4">{errors.payments}</p>
                    <button
                      onClick={fetchSellerPayments}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm"
                    >
                      Retry
                    </button>
                  </div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No payments received yet.</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      onClick={() => navigate("/dashboard/create-auction")}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full text-sm"
                    >
                      Create Auction to Start Selling
                    </motion.button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Net Profit Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className={`p-6 rounded-xl shadow-md ${
                          isDarkMode
                            ? "bg-gradient-to-r from-green-900 to-green-700"
                            : "bg-gradient-to-r from-green-100 to-green-200"
                        } flex items-center gap-4`}
                      >
                        <FaMoneyCheckAlt className="text-3xl text-green-500" />
                        <div>
                          <h3 className="text-lg font-semibold">
                            Net Profit (95%)
                          </h3>
                          <p className="text-2xl font-bold">
                            $<CountUp end={earnings.totalNetProfit} decimals={2} duration={2} />
                          </p>
                          <p className={labelStyle}>
                            From {earnings.completedCount} completed payments
                          </p>
                          <p className={`text-xs mt-1 ${labelStyle}`}>
                            Gross: ${earnings.totalGross.toFixed(2)} | Fee: ${earnings.totalPlatformFee.toFixed(2)}
                          </p>
                        </div>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className={`p-6 rounded-xl shadow-md ${
                          isDarkMode
                            ? "bg-gradient-to-r from-yellow-900 to-yellow-700"
                            : "bg-gradient-to-r from-yellow-100 to-yellow-200"
                        } flex items-center gap-4`}
                      >
                        <FaWallet className="text-3xl text-yellow-500" />
                        <div>
                          <h3 className="text-lg font-semibold">
                            Pending Net Profit (95%)
                          </h3>
                          <p className="text-2xl font-bold">
                            $<CountUp end={earnings.pendingNetProfit} decimals={2} duration={2} />
                          </p>
                          <p className={labelStyle}>{earnings.pendingCount} payments pending</p>
                          <p className={`text-xs mt-1 ${labelStyle}`}>
                            Gross: ${earnings.pendingGross.toFixed(2)} | Fee: ${(earnings.pendingGross * PLATFORM_FEE).toFixed(2)}
                          </p>
                        </div>
                      </motion.div>
                    </div>

                    {/* Payment Cards with Net Profit display */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {payments.slice(0, 4).map((payment) => {
                        const amount = payment.amount || payment.price || 0;
                        const netProfit = amount * SELLER_SHARE;
                        const fee = amount * PLATFORM_FEE;
                        const status = payment.status || payment.PaymentStatus || "pending";
                        const isCompleted = status === "completed" || status === "succeeded" || status === "success";
                        
                        return (
                          <motion.div
                            key={payment._id || payment.id || payment.trxid}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            whileHover={{ scale: 1.02 }}
                            className={`p-4 rounded-lg shadow-md ${
                              isDarkMode ? "bg-gray-700" : "bg-white"
                            } border ${
                              isDarkMode ? "border-gray-600" : "border-gray-200"
                            } hover:${
                              isDarkMode ? "bg-gray-600" : "bg-gray-50"
                            } transition-colors`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-lg font-semibold truncate">
                                {payment.auctionTitle || 
                                 payment.auctionDetails?.title || 
                                 payment.itemInfo?.name || 
                                 "Auction Item"}
                              </h4>
                              <span
                                className={`text-xs px-2 py-1 rounded-md capitalize ${
                                  isCompleted
                                    ? "bg-green-500 text-white"
                                    : "bg-yellow-500 text-white"
                                }`}
                              >
                                {status}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2 mb-2">
                              <FaMoneyCheckAlt className="text-green-500" />
                              <p className="text-sm font-semibold">
                                Net Profit: ${netProfit.toFixed(2)} (95%)
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2 mb-2">
                              <FaWallet className="text-purple-500" />
                              <p className="text-xs">
                                Gross: ${amount.toFixed(2)} | Fee: ${fee.toFixed(2)}
                              </p>
                            </div>
                            
                            <p className={labelStyle}>
                              Buyer: {payment.buyerName || 
                                     payment.buyerInfo?.name || 
                                     payment.buyerEmail?.split('@')[0] || 
                                     "Anonymous"}
                            </p>
                            
                            <p className={labelStyle}>
                              Date:{" "}
                              {payment.paymentDate || payment.createdAt
                                ? new Date(
                                    payment.paymentDate || payment.createdAt
                                  ).toLocaleDateString()
                                : "N/A"}
                            </p>

                            {/* Display seller email for verification */}
                            <p className={`text-xs mt-1 ${labelStyle}`}>
                              Seller Email: {payment.sellerEmail || 
                                           payment.sellerInfo?.email || 
                                           payment.seller?.email || 
                                           user?.email}
                            </p>

                            {payment.auctionId && (
                              <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                <p className={`text-xs ${labelStyle}`}>
                                  ID: {payment.auctionId.slice(-8)}
                                </p>
                                {payment.shippingAddress && (
                                  <p className={`text-xs ${labelStyle}`}>
                                    📦 {payment.shippingAddress.city || payment.shippingAddress.country}
                                  </p>
                                )}
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>

                    {payments.length > 4 && (
                      <div className="text-center mt-4">
                        <button
                          onClick={() => navigate("/dashboard/payments")}
                          className="text-purple-600 hover:text-purple-700 text-sm font-semibold"
                        >
                          View all {payments.length} payments →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Footer Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="space-y-6"
        >
          <div className={`${boxStyle}`}>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Total Net Profit</h3>
              {loadingStates.payments ? (
                <p className="text-gray-500">Loading profit...</p>
              ) : errors.payments ? (
                <p className="text-red-500">{errors.payments}</p>
              ) : (
                <>
                  <p className="text-3xl font-bold">
                    $<CountUp end={earnings.totalNetProfit} decimals={2} duration={2} />
                  </p>
                  <p className={labelStyle}>From {earnings.completedCount} completed sales</p>
                  <p className={`text-xs mt-1 ${labelStyle}`}>
                    Platform fees paid: ${earnings.totalPlatformFee.toFixed(2)}
                  </p>
                </>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="space-y-6"
        >
          <div className={`${boxStyle}`}>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              {payments.length > 0 ? (
                <div className="space-y-2">
                  <p className={labelStyle}>
                    Last payment net profit: ${((payments[0]?.amount || payments[0]?.price || 0) * SELLER_SHARE).toFixed(2)}
                  </p>
                  <p className={labelStyle}>
                    Date:{" "}
                    {payments[0]?.paymentDate || payments[0]?.createdAt
                      ? new Date(
                          payments[0]?.paymentDate || payments[0]?.createdAt
                        ).toLocaleDateString()
                      : "N/A"}
                  </p>
                  <p className={`text-xs ${labelStyle}`}>
                    From: {payments[0]?.buyerName || payments[0]?.buyerEmail?.split('@')[0] || "Anonymous"}
                  </p>
                </div>
              ) : (
                <p className={labelStyle}>No recent activity available.</p>
              )}
              
              {sellerStats.totalAuctions > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className={`text-xs ${labelStyle}`}>
                    📊 {sellerStats.activeAuctions} active auctions • {sellerStats.totalSold} sold
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="space-y-6"
        >
          <div className={`${boxStyle}`}>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => navigate("/dashboard/create-auction")}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm"
                >
                  ➕ Create New Auction
                </button>
                <button
                  onClick={() => navigate("/dashboard/manage-auctions")}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                >
                  📋 Manage Auctions
                </button>
                <button
                  onClick={() => navigate("/dashboard/payments")}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
                >
                  💰 View All Payments
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SellerProfile;