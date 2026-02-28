import { useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CountUp from "react-countup";
import useAuth from "../../../../hooks/useAuth";
import useAxiosSecure from "../../../../hooks/useAxiosSecure"; // Add this import
import coverPhoto from "../../../../assets/bg/hammer.webp";
import LoadingSpinner from "../../../LoadingSpinner";
import axios from "axios";
import {
  FaGavel,
  FaWallet,
  FaStar,
  FaFilter,
  FaSort,
  FaArrowRight,
  FaEdit,
  FaTimes,
  FaCheck,
  FaTrophy,
  FaHistory,
  FaCreditCard,
  FaEye,
  FaBell,
  FaMapMarkerAlt,
  FaPhone,
  FaCalendarAlt,
  FaDollarSign,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts";
import ThemeContext from "../../../Context/ThemeContext";
import SharedPayment from "../payment/SharedPayment";
import { toast } from "react-hot-toast";
import { useSocket } from "../../../../contexts/SocketContext";
import moment from "moment";

const COLORS = ["#8B5CF6", "#EC4899", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

const BuyerProfile = () => {
  const { user, loading: authLoading, dbUser } = useAuth();
  const axiosSecure = useAxiosSecure(); // Use secure axios with token
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState("overview");
  const { isDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();

  // API URL
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";

  // Modal states
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [coverOptions, setCoverOptions] = useState([]);
  const [currentCover, setCurrentCover] = useState(coverPhoto);
  const [selectedCover, setSelectedCover] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Data states - Dynamically fetched
  const [userStats, setUserStats] = useState({
    totalBids: 0,
    auctionsWon: 0,
    activeBids: 0,
    totalSpent: 0,
    memberSince: null,
    location: null,
    role: "buyer",
  });

  const [biddingHistory, setBiddingHistory] = useState([]);
  const [payments, setPayments] = useState([]);
  const [auctionStatus, setAuctionStatus] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [watchingNow, setWatchingNow] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [chartData, setChartData] = useState([]);

  // UI states
  const [loading, setLoading] = useState({
    stats: true,
    history: true,
    payments: true,
    status: true,
    activity: true,
    watching: true,
    notifications: true,
    charts: true,
  });

  const [error, setError] = useState({
    stats: null,
    history: null,
    payments: null,
    status: null,
    activity: null,
    watching: null,
  });

  // Filter states
  const [biddingFilter, setBiddingFilter] = useState("all");
  const [biddingSort, setBiddingSort] = useState("date-desc");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateRange, setDateRange] = useState("30days");
  const [timeFrame, setTimeFrame] = useState("week");

  // Edit profile state
  const [editProfileData, setEditProfileData] = useState({
    name: "",
    photo: "",
    Location: "",
    phone: "",
    bio: "",
  });

  // Pagination states
  const [bidPage, setBidPage] = useState(1);
  const [paymentPage, setPaymentPage] = useState(1);
  const [statusPage, setStatusPage] = useState(1);
  const [hasMoreBids, setHasMoreBids] = useState(true);
  const [hasMorePayments, setHasMorePayments] = useState(true);
  const [hasMoreStatus, setHasMoreStatus] = useState(true);

  const ITEMS_PER_PAGE = 10;

  // Initialize edit profile data when dbUser loads
  useEffect(() => {
    if (dbUser) {
      setEditProfileData({
        name: dbUser.name || user?.displayName || "",
        photo: dbUser.photo || user?.photoURL || "",
        Location: dbUser.Location || "",
        phone: dbUser.phone || "",
        bio: dbUser.bio || "",
      });
      
      // Set current cover from dbUser if available
      if (dbUser.coverImage) {
        setCurrentCover(dbUser.coverImage);
      }
    }
  }, [dbUser, user]);

  // Fetch all user data on mount
  useEffect(() => {
    if (user?.email) {
      fetchAllUserData();
    }
  }, [user?.email]);

  // Re-fetch when filters change
  useEffect(() => {
    if (user?.email && activeTab === "bidding") {
      fetchBiddingHistory(1, true);
    }
  }, [biddingFilter, biddingSort]);

  useEffect(() => {
    if (user?.email && activeTab === "payments") {
      fetchPayments(1, true);
    }
  }, [paymentFilter, dateRange]);

  useEffect(() => {
    if (user?.email && activeTab === "status") {
      fetchAuctionStatus(1, true);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (user?.email) {
      fetchChartData();
    }
  }, [timeFrame]);

  // Socket.IO real-time updates
  useEffect(() => {
    if (!socket || !user?.email) return;

    socket.emit("joinChat", { userId: user.email, selectedUserId: "system" });

    socket.on("newBid", handleNewBid);
    socket.on("auctionWon", handleAuctionWon);
    socket.on("paymentConfirmed", handlePaymentUpdate);
    socket.on("receiveNotification", handleNewNotification);
    socket.on("outbid", handleOutbid);

    return () => {
      socket.off("newBid");
      socket.off("auctionWon");
      socket.off("paymentConfirmed");
      socket.off("receiveNotification");
      socket.off("outbid");
    };
  }, [socket, user?.email]);

  // Real-time event handlers
  const handleNewBid = (bidData) => {
    if (bidData.email === user?.email) {
      toast.success(`Your bid of $${bidData.amount} was placed successfully!`);
      fetchBiddingHistory(1, true);
      fetchUserStats();
      fetchRecentActivity();
    }
  };

  const handleAuctionWon = (data) => {
    if (data.winner?.email === user?.email) {
      toast.success(`🎉 Congratulations! You won ${data.auctionName}!`);
      fetchAuctionStatus(1, true);
      fetchUserStats();
      fetchRecentActivity();
    }
  };

  const handlePaymentUpdate = (data) => {
    if (data.buyerEmail === user?.email) {
      toast.success(`Payment of $${data.amount} confirmed!`);
      fetchPayments(1, true);
      fetchUserStats();
      fetchRecentActivity();
    }
  };

  const handleNewNotification = (notification) => {
    setNotifications((prev) => [notification, ...prev].slice(0, 50));
    if (!notification.read) {
      toast(notification.title, { icon: "🔔" });
    }
  };

  const handleOutbid = (data) => {
    if (data.email === user?.email) {
      toast.error(`You've been outbid on ${data.auctionName}!`);
      fetchAuctionStatus(1, true);
    }
  };

  // Main data fetching function
  const fetchAllUserData = async () => {
    try {
      await Promise.all([
        fetchUserStats(),
        fetchBiddingHistory(1, true),
        fetchPayments(1, true),
        fetchAuctionStatus(1, true),
        fetchRecentActivity(),
        fetchWatchingItems(),
        fetchCoverOptions(),
        fetchNotifications(),
        fetchChartData(),
      ]);
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load some data. Please refresh the page.");
    }
  };

  // Individual fetch functions
  const fetchUserStats = async () => {
    setLoading(prev => ({ ...prev, stats: true }));
    setError(prev => ({ ...prev, stats: null }));
    try {
      const response = await axios.get(`${apiUrl}/user-stats/${user.email}`);
      setUserStats(response.data);
    } catch (err) {
      console.error("Error fetching user stats:", err);
      setError(prev => ({ ...prev, stats: "Failed to load stats" }));
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  };

  const fetchBiddingHistory = async (page = 1, reset = false) => {
    setLoading(prev => ({ ...prev, history: true }));
    setError(prev => ({ ...prev, history: null }));
    try {
      const response = await axios.get(
        `${apiUrl}/bid-history/${user.email}?page=${page}&limit=${ITEMS_PER_PAGE}`
      );
      
      const newBids = response.data;
      setHasMoreBids(newBids.length === ITEMS_PER_PAGE);
      
      // Apply filter and sort locally
      let filteredBids = newBids;
      if (biddingFilter !== "all") {
        filteredBids = filteredBids.filter((bid) => bid.status === biddingFilter);
      }
      
      filteredBids.sort((a, b) => {
        if (biddingSort === "date-desc") {
          return new Date(b.time || 0) - new Date(a.time || 0);
        } else if (biddingSort === "date-asc") {
          return new Date(a.time || 0) - new Date(b.time || 0);
        } else if (biddingSort === "amount-desc") {
          return (b.bidAmount || 0) - (a.bidAmount || 0);
        } else if (biddingSort === "amount-asc") {
          return (a.bidAmount || 0) - (b.bidAmount || 0);
        }
        return 0;
      });
      
      if (reset) {
        setBiddingHistory(filteredBids);
        setBidPage(1);
      } else {
        setBiddingHistory(prev => [...prev, ...filteredBids]);
      }
    } catch (err) {
      console.error("Error fetching bidding history:", err);
      setError(prev => ({ ...prev, history: "Failed to load bidding history" }));
    } finally {
      setLoading(prev => ({ ...prev, history: false }));
    }
  };

  const fetchPayments = async (page = 1, reset = false) => {
    setLoading(prev => ({ ...prev, payments: true }));
    setError(prev => ({ ...prev, payments: null }));
    try {
      // Use axiosSecure which automatically includes the token
      const response = await axiosSecure.get(`/api/payments/user/${user.email}`);
      
      let allPayments = response.data.payments || [];
      
      // Apply date filter
      const now = moment();
      if (dateRange === "7days") {
        allPayments = allPayments.filter(p => 
          p.createdAt && moment(p.createdAt).isAfter(now.clone().subtract(7, 'days'))
        );
      } else if (dateRange === "30days") {
        allPayments = allPayments.filter(p => 
          p.createdAt && moment(p.createdAt).isAfter(now.clone().subtract(30, 'days'))
        );
      } else if (dateRange === "90days") {
        allPayments = allPayments.filter(p => 
          p.createdAt && moment(p.createdAt).isAfter(now.clone().subtract(90, 'days'))
        );
      }
      
      // Apply status filter
      if (paymentFilter !== "all") {
        allPayments = allPayments.filter(p => {
          const status = (p.PaymentStatus || p.status || '').toLowerCase();
          return status === paymentFilter.toLowerCase();
        });
      }
      
      // Sort by date (newest first)
      allPayments.sort((a, b) => 
        moment(b.createdAt).valueOf() - moment(a.createdAt).valueOf()
      );
      
      // Paginate
      const start = (page - 1) * ITEMS_PER_PAGE;
      const paginatedPayments = allPayments.slice(start, start + ITEMS_PER_PAGE);
      setHasMorePayments(allPayments.length > start + ITEMS_PER_PAGE);
      
      if (reset) {
        setPayments(paginatedPayments);
        setPaymentPage(1);
      } else {
        setPayments(prev => [...prev, ...paginatedPayments]);
      }
      
      // Update total spent in userStats
      const totalSpent = allPayments.reduce((sum, p) => 
        sum + (p.price || p.amount || 0), 0
      );
      setUserStats(prev => ({ ...prev, totalSpent }));
      
    } catch (err) {
      console.error("Error fetching payments:", err);
      setError(prev => ({ ...prev, payments: "Failed to load payments" }));
    } finally {
      setLoading(prev => ({ ...prev, payments: false }));
    }
  };

  const fetchAuctionStatus = async (page = 1, reset = false) => {
    setLoading(prev => ({ ...prev, status: true }));
    setError(prev => ({ ...prev, status: null }));
    try {
      const response = await axios.get(
        `${apiUrl}/user-auction-status/${user.email}`
      );
      
      let allStatus = response.data;
      
      // Apply status filter
      if (statusFilter !== "All") {
        allStatus = allStatus.filter(s => 
          s.status.toLowerCase() === statusFilter.toLowerCase()
        );
      }
      
      // Sort by most recent
      allStatus.sort((a, b) => 
        moment(b.endTime).valueOf() - moment(a.endTime).valueOf()
      );
      
      // Paginate
      const start = (page - 1) * ITEMS_PER_PAGE;
      const paginatedStatus = allStatus.slice(start, start + ITEMS_PER_PAGE);
      setHasMoreStatus(allStatus.length > start + ITEMS_PER_PAGE);
      
      if (reset) {
        setAuctionStatus(paginatedStatus);
        setStatusPage(1);
      } else {
        setAuctionStatus(prev => [...prev, ...paginatedStatus]);
      }
    } catch (err) {
      console.error("Error fetching auction status:", err);
      setError(prev => ({ ...prev, status: "Failed to load auction status" }));
    } finally {
      setLoading(prev => ({ ...prev, status: false }));
    }
  };

  const fetchRecentActivity = async () => {
    setLoading(prev => ({ ...prev, activity: true }));
    setError(prev => ({ ...prev, activity: null }));
    try {
      const response = await axios.get(`${apiUrl}/recent-activity/${user.email}?limit=20`);
      setRecentActivity(response.data);
    } catch (err) {
      console.error("Error fetching recent activity:", err);
      setError(prev => ({ ...prev, activity: "Failed to load recent activity" }));
    } finally {
      setLoading(prev => ({ ...prev, activity: false }));
    }
  };

  const fetchWatchingItems = async () => {
    setLoading(prev => ({ ...prev, watching: true }));
    setError(prev => ({ ...prev, watching: null }));
    try {
      const response = await axios.get(`${apiUrl}/watching/${user.email}`);
      setWatchingNow(response.data);
    } catch (err) {
      console.error("Error fetching watching items:", err);
      setError(prev => ({ ...prev, watching: "Failed to load watching items" }));
    } finally {
      setLoading(prev => ({ ...prev, watching: false }));
    }
  };

  const fetchCoverOptions = async () => {
    try {
      const response = await axios.get(`${apiUrl}/cover-options`);
      setCoverOptions(response.data);
    } catch (error) {
      console.error("Error fetching cover options:", error);
      setCoverOptions([
        { id: 1, image: "https://images.unsplash.com/photo-1557683316-973673baf926?w=1200" },
        { id: 2, image: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1200" },
        { id: 3, image: "https://images.unsplash.com/photo-1557683311-eac922347aa1?w=1200" },
        { id: 4, image: "https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=1200" },
      ]);
    }
  };

  const fetchNotifications = async () => {
    setLoading(prev => ({ ...prev, notifications: true }));
    try {
      const response = await axios.get(`${apiUrl}/notifications/${user.email}`);
      setNotifications(response.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(prev => ({ ...prev, notifications: false }));
    }
  };

  const fetchChartData = async () => {
    setLoading(prev => ({ ...prev, charts: true }));
    try {
      const days = timeFrame === "week" ? 7 : timeFrame === "month" ? 30 : 365;
      
      // Generate chart data from bidding history
      const response = await axios.get(`${apiUrl}/bid-history/${user.email}`);
      const allBids = response.data;
      
      const chartData = [];
      const today = moment();
      
      for (let i = days; i >= 0; i--) {
        const date = moment().subtract(i, 'days');
        const dayBids = allBids.filter(bid => 
          bid.time && moment(bid.time).isSame(date, 'day')
        );
        
        chartData.push({
          date: date.format("MMM DD"),
          bids: dayBids.length,
          amount: dayBids.reduce((sum, bid) => sum + (bid.bidAmount || 0), 0),
          won: dayBids.filter(bid => bid.status === "Won").length,
        });
      }
      
      setChartData(chartData);
    } catch (error) {
      console.error("Error fetching chart data:", error);
    } finally {
      setLoading(prev => ({ ...prev, charts: false }));
    }
  };

  // Actions
  const saveCoverImage = async () => {
    if (!selectedCover || !user?.uid) return;
    setIsSaving(true);
    try {
      await axiosSecure.patch(`/cover`, {
        userId: user.uid,
        image: selectedCover,
      });
      setCurrentCover(selectedCover);
      setIsCoverModalOpen(false);
      toast.success("Cover image updated successfully!");
    } catch (error) {
      console.error("Error saving cover image:", error);
      toast.error("Failed to save cover image. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveProfileChanges = async () => {
    setIsSaving(true);
    try {
      await axiosSecure.patch(`/user/profile/${user.email}`, editProfileData);
      toast.success("Profile updated successfully!");
      setIsEditProfileModalOpen(false);
      fetchUserStats();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleWatching = async (auctionId) => {
    try {
      const response = await axiosSecure.post(`/watching/toggle`, {
        email: user.email,
        auctionId,
      });
      
      toast.success(response.data.watching ? "Added to watching list" : "Removed from watching list");
      fetchWatchingItems();
    } catch (error) {
      console.error("Error toggling watching:", error);
      toast.error("Failed to update watching list");
    }
  };

  const markNotificationsAsRead = async () => {
    try {
      await axiosSecure.put(`/notifications/mark-read/${user.email}`);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const loadMoreBids = () => {
    const nextPage = bidPage + 1;
    setBidPage(nextPage);
    fetchBiddingHistory(nextPage);
  };

  const loadMorePayments = () => {
    const nextPage = paymentPage + 1;
    setPaymentPage(nextPage);
    fetchPayments(nextPage);
  };

  const loadMoreStatus = () => {
    const nextPage = statusPage + 1;
    setStatusPage(nextPage);
    fetchAuctionStatus(nextPage);
  };

  // Render functions
  const renderStatusBadge = (status) => {
    const badges = {
      Won: "bg-green-500 text-white",
      won: "bg-green-500 text-white",
      Active: "bg-blue-500 text-white",
      active: "bg-blue-500 text-white",
      Outbid: "bg-red-500 text-white",
      outbid: "bg-red-500 text-white",
      Ended: "bg-gray-500 text-white",
      ended: "bg-gray-500 text-white",
      Lost: "bg-red-500 text-white",
      lost: "bg-red-500 text-white",
      completed: "bg-green-500 text-white",
      success: "bg-green-500 text-white",
      pending: "bg-yellow-500 text-white",
      failed: "bg-red-500 text-white",
    };
    
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold ${
          badges[status?.toLowerCase()] || "bg-gray-500 text-white"
        }`}
      >
        {status}
      </span>
    );
  };

  const boxStyle = `border rounded-xl shadow-lg ${
    isDarkMode
      ? "bg-gray-800 border-gray-700"
      : "bg-white border-gray-200"
  } transition-all duration-300`;

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
        className="relative h-[350px] bg-cover bg-center rounded-2xl overflow-hidden shadow-xl group"
        style={{
          backgroundImage: `url(${currentCover})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black opacity-40 group-hover:opacity-50 transition-opacity"></div>
        
        <button
          onClick={() => setIsCoverModalOpen(true)}
          className="absolute right-4 top-4 bg-white/90 hover:bg-white text-gray-800 px-4 py-2 rounded-full text-sm font-semibold flex items-center shadow-md transition-all transform hover:scale-105 z-10"
        >
          <FaEdit className="mr-2" /> Edit Cover
        </button>
        
        <button
          onClick={markNotificationsAsRead}
          className="absolute left-4 top-4 bg-white/90 hover:bg-white text-gray-800 px-4 py-2 rounded-full text-sm font-semibold flex items-center shadow-md transition-all z-10"
        >
          <FaBell className="mr-2" />
          <span className="relative">
            Notifications
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </span>
        </button>
      </motion.div>

      {/* Cover Image Modal */}
      <AnimatePresence>
        {isCoverModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black bg-opacity-75 flex justify-center items-center p-4"
            onClick={() => setIsCoverModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className={`${
                isDarkMode ? "bg-gray-800" : "bg-white"
              } p-8 rounded-2xl w-full max-w-5xl shadow-2xl max-h-[90vh] overflow-y-auto`}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  Choose Cover Image
                </h2>
                <button
                  onClick={() => setIsCoverModalOpen(false)}
                  className={`p-2 rounded-full ${
                    isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  }`}
                >
                  <FaTimes />
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {coverOptions.map((cover) => (
                  <motion.div
                    key={cover.id}
                    whileHover={{ scale: 1.05 }}
                    className={`cursor-pointer border-4 rounded-lg transition-all relative ${
                      selectedCover === cover.image
                        ? "border-purple-500"
                        : "border-transparent"
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
                    />
                    {selectedCover === cover.image && (
                      <div className="absolute top-2 right-2 bg-purple-500 rounded-full p-1">
                        <FaCheck className="text-white text-xs" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
              
              <div className="flex justify-end mt-8 space-x-4">
                <button
                  onClick={() => setIsCoverModalOpen(false)}
                  className={`px-6 py-2 rounded-full ${
                    isDarkMode
                      ? "bg-gray-700 text-white hover:bg-gray-600"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  } font-semibold transition-colors`}
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
                  } text-white font-semibold transition-colors flex items-center`}
                  disabled={isSaving || !selectedCover}
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditProfileModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black bg-opacity-75 flex justify-center items-center p-4"
            onClick={() => setIsEditProfileModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className={`${
                isDarkMode ? "bg-gray-800" : "bg-white"
              } p-8 rounded-2xl w-full max-w-2xl shadow-2xl`}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  Edit Profile
                </h2>
                <button
                  onClick={() => setIsEditProfileModalOpen(false)}
                  className={`p-2 rounded-full ${
                    isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  }`}
                >
                  <FaTimes />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editProfileData.name}
                    onChange={(e) => setEditProfileData({ ...editProfileData, name: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Photo URL
                  </label>
                  <input
                    type="text"
                    value={editProfileData.photo}
                    onChange={(e) => setEditProfileData({ ...editProfileData, photo: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Location
                  </label>
                  <input
                    type="text"
                    value={editProfileData.Location}
                    onChange={(e) => setEditProfileData({ ...editProfileData, Location: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Phone
                  </label>
                  <input
                    type="text"
                    value={editProfileData.phone}
                    onChange={(e) => setEditProfileData({ ...editProfileData, phone: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Bio
                  </label>
                  <textarea
                    value={editProfileData.bio}
                    onChange={(e) => setEditProfileData({ ...editProfileData, bio: e.target.value })}
                    rows="4"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  />
                </div>
              </div>

              <div className="flex justify-end mt-8 space-x-4">
                <button
                  onClick={() => setIsEditProfileModalOpen(false)}
                  className={`px-6 py-2 rounded-full ${
                    isDarkMode
                      ? "bg-gray-700 text-white hover:bg-gray-600"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  } font-semibold transition-colors`}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={saveProfileChanges}
                  className={`px-6 py-2 rounded-full ${
                    isSaving
                      ? "bg-purple-400 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-700"
                  } text-white font-semibold transition-colors flex items-center`}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
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
        className="px-6 -mt-20 mb-8 relative z-10"
      >
        <div className={`flex flex-col md:flex-row items-center gap-6 ${boxStyle} p-6`}>
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
                src={editProfileData.photo || user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName || 'User'}&background=8B5CF6&color=fff&size=128`}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </motion.div>
            <button
              onClick={() => setIsEditProfileModalOpen(true)}
              className="absolute bottom-0 right-0 bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 transition-colors"
            >
              <FaEdit className="text-xs" />
            </button>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {editProfileData.name || user?.displayName || "User"}
                </h1>
                <p className={`${isDarkMode ? "text-gray-300" : "text-gray-600"} mt-1`}>
                  {user?.email}
                </p>
              </div>
              
              <div className="flex items-center gap-2 mt-2 md:mt-0">
                {userStats.role && (
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    userStats.role === "buyer" 
                      ? "bg-green-600 text-white" 
                      : userStats.role === "seller"
                      ? "bg-purple-600 text-white"
                      : "bg-blue-600 text-white"
                  }`}>
                    {userStats.role}
                  </span>
                )}
                <div className="flex items-center gap-1 ml-2">
                  {[...Array(5)].map((_, i) => (
                    <FaStar key={i} className={i < 4 ? "text-yellow-400" : "text-gray-300"} />
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {editProfileData.Location && (
                <div className="flex items-center gap-2 text-sm">
                  <FaMapMarkerAlt className="text-purple-500" />
                  <span>{editProfileData.Location}</span>
                </div>
              )}
              {editProfileData.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <FaPhone className="text-purple-500" />
                  <span>{editProfileData.phone}</span>
                </div>
              )}
              {userStats.memberSince && (
                <div className="flex items-center gap-2 text-sm">
                  <FaCalendarAlt className="text-purple-500" />
                  <span>Member since {moment(userStats.memberSince).format('MMM YYYY')}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <FaDollarSign className="text-purple-500" />
                <span>Total Spent: ${userStats.totalSpent?.toFixed(2)}</span>
              </div>
            </div>

            {editProfileData.bio && (
              <p className={`mt-4 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                {editProfileData.bio}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          className={`${boxStyle} p-6 flex items-center gap-4`}
        >
          <div className="p-3 bg-blue-500 rounded-full">
            <FaGavel className="text-white text-xl" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Bids</p>
            {loading.stats ? (
              <div className="h-8 w-16 bg-gray-300 animate-pulse rounded"></div>
            ) : (
              <p className="text-2xl font-bold">
                <CountUp end={userStats.totalBids} duration={2} />
              </p>
            )}
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className={`${boxStyle} p-6 flex items-center gap-4`}
        >
          <div className="p-3 bg-green-500 rounded-full">
            <FaTrophy className="text-white text-xl" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Auctions Won</p>
            {loading.stats ? (
              <div className="h-8 w-16 bg-gray-300 animate-pulse rounded"></div>
            ) : (
              <p className="text-2xl font-bold">
                <CountUp end={userStats.auctionsWon} duration={2} />
              </p>
            )}
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className={`${boxStyle} p-6 flex items-center gap-4`}
        >
          <div className="p-3 bg-purple-500 rounded-full">
            <FaHistory className="text-white text-xl" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Active Bids</p>
            {loading.stats ? (
              <div className="h-8 w-16 bg-gray-300 animate-pulse rounded"></div>
            ) : (
              <p className="text-2xl font-bold">
                <CountUp end={userStats.activeBids} duration={2} />
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Main Content Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className={`${boxStyle} mb-8`}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "overview", label: "Overview", icon: FaStar },
              { id: "bidding", label: "Bidding History", icon: FaHistory },
              { id: "payments", label: "Payments", icon: FaCreditCard },
              { id: "status", label: "Auction Status", icon: FaTrophy },
              { id: "watching", label: "Watching", icon: FaEye },
            ].map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.05 }}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 transition-all ${
                  activeTab === tab.id
                    ? "bg-purple-600 text-white shadow-lg"
                    : isDarkMode
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                <tab.icon className="text-xs" />
                {tab.label}
                {tab.id === "watching" && watchingNow.length > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {watchingNow.length}
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Overview Tab - Keep existing code */}
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* ... Overview content ... */}
              </motion.div>
            )}

            {/* Bidding History Tab - Keep existing code */}
            {activeTab === "bidding" && (
              <motion.div
                key="bidding"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* ... Bidding History content ... */}
              </motion.div>
            )}

            {/* Payments Tab */}
            {activeTab === "payments" && (
              <motion.div
                key="payments"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <SharedPayment />
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 mt-6">
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={paymentFilter}
                      onChange={(e) => setPaymentFilter(e.target.value)}
                      className={`p-2 rounded-lg ${
                        isDarkMode
                          ? "bg-gray-700 text-white border-gray-600"
                          : "bg-white text-gray-800 border-gray-200"
                      } border`}
                    >
                      <option value="all">All Payments</option>
                      <option value="success">Success</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                    </select>
                    
                    <select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      className={`p-2 rounded-lg ${
                        isDarkMode
                          ? "bg-gray-700 text-white border-gray-600"
                          : "bg-white text-gray-800 border-gray-200"
                      } border`}
                    >
                      <option value="7days">Last 7 Days</option>
                      <option value="30days">Last 30 Days</option>
                      <option value="90days">Last 90 Days</option>
                      <option value="all">All Time</option>
                    </select>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    Total Spent: ${payments.reduce((sum, p) => sum + (p.price || p.amount || 0), 0).toFixed(2)}
                  </div>
                </div>
                
                {loading.payments && payments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Loading payments...</p>
                  </div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-12">
                    <FaCreditCard className="text-5xl text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No payment history found.</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className={`border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                            <th className="text-left py-3 px-4">Transaction ID</th>
                            <th className="text-left py-3 px-4">Auction</th>
                            <th className="text-left py-3 px-4">Amount</th>
                            <th className="text-left py-3 px-4">Status</th>
                            <th className="text-left py-3 px-4">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map((payment) => (
                            <tr
                              key={payment._id}
                              className={`border-t ${
                                isDarkMode ? "border-gray-700" : "border-gray-200"
                              } hover:${isDarkMode ? "bg-gray-700" : "bg-gray-50"} transition-colors`}
                            >
                              <td className="py-3 px-4 font-mono text-sm">{payment.trxid || payment.paymentIntentId?.slice(0, 8)}...</td>
                              <td className="py-3 px-4">{payment.auctionName || payment.auctionDetails?.title || "N/A"}</td>
                              <td className="py-3 px-4 font-bold text-purple-600">${(payment.price || payment.amount || 0).toFixed(2)}</td>
                              <td className="py-3 px-4">{renderStatusBadge(payment.PaymentStatus || payment.status || "pending")}</td>
                              <td className="py-3 px-4 text-sm">
                                {payment.createdAt ? moment(payment.createdAt).format('MMM DD, YYYY') : "N/A"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {hasMorePayments && (
                      <div className="mt-6 text-center">
                        <button
                          onClick={loadMorePayments}
                          disabled={loading.payments}
                          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-semibold transition-colors disabled:opacity-50"
                        >
                          {loading.payments ? "Loading..." : "Load More"}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {/* Auction Status Tab - Keep existing code */}
            {activeTab === "status" && (
              <motion.div
                key="status"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* ... Auction Status content ... */}
              </motion.div>
            )}

            {/* Watching Tab - Keep existing code */}
            {activeTab === "watching" && (
              <motion.div
                key="watching"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* ... Watching content ... */}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Notifications Panel */}
      {notifications.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className={`${boxStyle} mb-8`}
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Recent Notifications</h3>
              {notifications.filter(n => !n.read).length > 0 && (
                <button
                  onClick={markNotificationsAsRead}
                  className="text-sm text-purple-600 hover:text-purple-700 font-semibold"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>
          <div className="p-6 max-h-80 overflow-y-auto">
            {loading.notifications ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
              </div>
            ) : notifications.slice(0, 5).map((notification) => (
              <div
                key={notification._id}
                className={`p-3 rounded-lg mb-2 ${
                  !notification.read 
                    ? isDarkMode ? "bg-gray-700" : "bg-purple-50"
                    : ""
                }`}
              >
                <p className="font-medium">{notification.title}</p>
                <p className="text-sm text-gray-500">{notification.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {moment(notification.createdAt).fromNow()}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default BuyerProfile;