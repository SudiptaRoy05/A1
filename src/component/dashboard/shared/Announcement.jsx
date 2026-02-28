"use client";

import { useContext, useState, useRef, useEffect, useMemo } from "react";
import {
  FiBell,
  FiInfo,
  FiChevronLeft,
  FiChevronRight,
  FiEdit,
  FiTrash,
  FiX,
  FiClock,
  FiMail,
  FiUser,
  FiTag,
} from "react-icons/fi";
import { FaGavel, FaUsers, FaCheckCircle } from "react-icons/fa";
import { RiUserStarFill } from "react-icons/ri";
import "./Announcement.css";
import LoadingSpinner from "../../LoadingSpinner";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";
import ThemeContext from "../../Context/ThemeContext";
import io from "socket.io-client";
import useAuth from "../../../hooks/useAuth";
import useAxiosPublic from "../../../hooks/useAxiosPublic";
import { useGetAnnouncementsQuery } from "../../../redux/features/api/announcementApi";
import EditAnnouncementModal from "../admin/EditAnnouncementModal";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";

const Announcement = () => {
  const {
    data: announcements,
    isLoading,
    refetch,
  } = useGetAnnouncementsQuery();
  
  const { isDarkMode } = useContext(ThemeContext);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const socketRef = useRef(null);
  const location = useLocation();
  const [notificationDetails, setNotificationDetails] = useState(null);
  const [allNotifications, setAllNotifications] = useState([]);
  const [notificationUsers, setNotificationUsers] = useState({});
  const [notificationFilter, setNotificationFilter] = useState("all");
  const [notificationCount, setNotificationCount] = useState(0);
  const axiosPublic = useAxiosPublic();
  const [userRole, setUserRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      if (user?.email) {
        try {
          setRoleLoading(true);
          const response = await axiosPublic.get(`/user/${user.email}`);
          setUserRole(response.data.role || "buyer");
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUserRole("buyer");
        } finally {
          setRoleLoading(false);
        }
      }
    };

    fetchUserRole();
  }, [user, axiosPublic]);

  const isAdmin = useMemo(() => userRole === "admin", [userRole]);

  // Pagination calculations
  const totalPages = Math.ceil((announcements?.length || 0) / itemsPerPage);
  
  const currentAnnouncements = useMemo(() => {
    if (!announcements) return [];
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return announcements.slice(start, end);
  }, [announcements, currentPage, itemsPerPage]);

  // Reset to first page when items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // Responsive items per page
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setItemsPerPage(3);
      } else if (window.innerWidth < 1024) {
        setItemsPerPage(6);
      } else {
        setItemsPerPage(9);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Check for incoming notification from route state
  useEffect(() => {
    if (location.state?.notificationDetails) {
      setNotificationDetails(location.state.notificationDetails);
      setIsNotificationModalOpen(true);
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Initialize socket connection
  useEffect(() => {
    if (!user) return;

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("receiveNotification", (notification) => {
      setAllNotifications((prev) => [notification, ...prev]);
      setNotificationCount((prev) => prev + 1);
      
      toast.success(notification.title, {
        description: notification.message,
        duration: 5000,
      });

      if (notification.type === "announcement" && notification.announcementData) {
        setNotificationDetails(notification);
        setIsNotificationModalOpen(true);
      }
    });

    socket.on("connect", () => {
      console.log("Socket connected for notifications");
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // Fetch notifications and users
  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUsers();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const response = await axiosPublic.get(`/notifications/${user.email}`);
      if (response.data) {
        setAllNotifications(response.data);
        const unreadCount = response.data.filter((n) => !n.read).length;
        setNotificationCount(unreadCount);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axiosPublic.get("/users");
      if (response.data) {
        const userMap = {};
        response.data.forEach((user) => {
          userMap[user.email] = user;
        });
        setNotificationUsers(userMap);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleEdit = (announcement, e) => {
    e.stopPropagation();
    setSelectedAnnouncement(announcement);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    
    if (!window.confirm("Are you sure you want to delete this announcement?")) {
      return;
    }

    try {
      const response = await axios.delete(
        `http://localhost:5001/announcement/${id}`
      );
      if (response.status === 200) {
        toast.success("Announcement deleted successfully!");
        refetch();
      }
    } catch (error) {
      toast.error("Failed to delete the announcement. Please try again.");
      console.error("Error deleting announcement:", error);
    }
  };

  const sendAnnouncementNotification = (announcement, e) => {
    e.stopPropagation();
    
    if (!socketRef.current || !socketRef.current.connected) {
      toast.error("Cannot send notification at this moment. Please try again later.");
      return;
    }

    const notificationData = {
      type: "announcement",
      title: `New Announcement: ${announcement.title}`,
      message: announcement.content.substring(0, 150) + 
        (announcement.content.length > 150 ? "..." : ""),
      announcementData: {
        _id: announcement._id,
        title: announcement.title,
        content: announcement.content,
        date: announcement.date,
        image: announcement.files?.[0]?.url,
      },
      sender: user?.email,
      recipient: announcement.targetAudience || "all",
      timestamp: new Date().toISOString(),
      read: false,
    };

    socketRef.current.emit("sendNotification", notificationData, (response) => {
      if (response?.success) {
        toast.success("Announcement notification sent to all users");
      } else {
        toast.error("Failed to send announcement notification");
      }
    });
  };

  const viewNotificationDetails = (notification) => {
    setNotificationDetails(notification);
    setIsNotificationModalOpen(true);

    if (!notification.read) {
      markNotificationAsRead(notification._id);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    setNotificationCount((prev) => Math.max(0, prev - 1));
    
    setAllNotifications((prev) =>
      prev.map((n) => 
        n._id === notificationId ? { ...n, read: true } : n
      )
    );

    try {
      await axiosPublic.put(
        `/notifications/mark-read/${user.email}`,
        { notificationId }
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const getUserDetails = (email) => {
    if (!email || email === "all") {
      return { 
        name: "All Users", 
        photo: "/placeholder.svg",
        role: "system"
      };
    }
    return notificationUsers[email] || { 
      name: email.split('@')[0], 
      photo: "/placeholder.svg",
      role: "user"
    };
  };

  const markAllNotificationsAsRead = async () => {
    try {
      setAllNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );
      setNotificationCount(0);

      await axiosPublic.put(`/notifications/mark-all-read/${user.email}`);
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      toast.error("Failed to mark notifications as read");
    }
  };

  const getFilteredNotifications = () => {
    switch (notificationFilter) {
      case "unread":
        return allNotifications.filter((n) => !n.read);
      case "announcement":
        return allNotifications.filter((n) => n.type === "announcement");
      case "auction-win":
        return allNotifications.filter((n) => n.type === "auction-win");
      default:
        return allNotifications;
    }
  };

  const filteredNotifications = getFilteredNotifications();

  const getNotificationIcon = (type) => {
    switch (type) {
      case "announcement":
        return <FiBell className="text-purple-500" />;
      case "auction-win":
        return <FaGavel className="text-yellow-500" />;
      default:
        return <FiInfo className="text-blue-500" />;
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInHours = Math.floor((now - notificationDate) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return notificationDate.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return notificationDate.toLocaleDateString();
    }
  };

  if (isLoading || roleLoading) return <LoadingSpinner />;

  return (
    <div
      className={`px-4 md:px-8 py-10 min-h-screen ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-purple-50 text-gray-800"
      }`}
    >
      {/* Notifications Section */}
      <div className="mb-8 max-w-7xl mx-auto">
        <div
          className={`rounded-xl shadow-md overflow-hidden ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <div
            className={`p-6 border-b ${
              isDarkMode ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <div className="flex flex-wrap justify-between items-center gap-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <FiBell className="text-purple-500" />
                Notifications
                {notificationCount > 0 && (
                  <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold text-white bg-red-500 rounded-full animate-pulse">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                )}
              </h3>
              
              {notificationCount > 0 && (
                <button
                  onClick={markAllNotificationsAsRead}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                    isDarkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Filter tabs */}
            <div className="flex flex-wrap gap-2 mt-4">
              {["all", "unread", "announcement", "auction-win"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setNotificationFilter(filter)}
                  className={`px-4 py-1.5 text-sm rounded-full capitalize transition-colors ${
                    notificationFilter === filter
                      ? "bg-purple-600 text-white"
                      : isDarkMode
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {filter === "auction-win" ? "Auction Wins" : filter}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications list */}
          <div className="max-h-96 overflow-y-auto">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => {
                const sender = getUserDetails(notification.sender);
                return (
                  <div
                    key={notification._id}
                    className={`p-4 border-b transition-colors cursor-pointer ${
                      isDarkMode ? "border-gray-700" : "border-gray-200"
                    } ${
                      notification.read
                        ? isDarkMode
                          ? "hover:bg-gray-700"
                          : "hover:bg-gray-100"
                        : isDarkMode
                        ? "bg-gray-700/50 hover:bg-gray-600"
                        : "bg-purple-100/50 hover:bg-gray-200"
                    }`}
                    onClick={() => viewNotificationDetails(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={sender.photo}
                        alt={sender.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-purple-200"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${sender.name}&background=6d28d9&color=fff`;
                        }}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className={`font-semibold truncate ${
                            !notification.read ? "font-bold" : ""
                          }`}>
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-purple-500 rounded-full ml-2 flex-shrink-0"></span>
                          )}
                        </div>
                        
                        <p className="text-sm mt-1 line-clamp-2">
                          {notification.message}
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                              notification.type === "announcement"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : notification.type === "auction-win"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                            }`}>
                              {getNotificationIcon(notification.type)}
                              <span>
                                {notification.type === "auction-win" 
                                  ? "Auction Win" 
                                  : notification.type}
                              </span>
                            </span>
                            
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <FiUser className="w-3 h-3" />
                              {sender.name}
                            </span>
                          </div>
                          
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <FiClock className="w-3 h-3" />
                            {formatDate(notification.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <FiInfo className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-500">No notifications found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Announcements Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Announcements</h2>
          {isAdmin && (
            <button
              onClick={() => navigate("/dashboard/create-announcement")}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              + Create Announcement
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentAnnouncements.map((item) => (
            <div
              key={item._id}
              className={`relative rounded-xl overflow-hidden shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={item.files?.[0]?.url || "/placeholder.svg"}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  onError={(e) => {
                    e.target.src = "/placeholder.svg";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-bold text-white drop-shadow-lg line-clamp-2">
                    {item.title}
                  </h3>
                </div>

                {isAdmin && (
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={(e) => handleEdit(item, e)}
                      className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      title="Edit announcement"
                    >
                      <FiEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(item._id, e)}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      title="Delete announcement"
                    >
                      <FiTrash className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
                  <FiClock className="w-4 h-4" />
                  <span>
                    {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                  </span>
                </div>

                <p className={`text-sm line-clamp-3 mb-3 ${
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                }`}>
                  {item.content}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                    isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"
                  }`}>
                    <FaUsers className="w-3 h-3" />
                    {item.targetAudience || "All Users"}
                  </span>

                  <div className="flex gap-2">
                    {isAdmin && (
                      <button
                        onClick={(e) => sendAnnouncementNotification(item, e)}
                        className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                        title="Send as notification"
                      >
                        <FiBell className="w-4 h-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => navigate(`/announcementDetails/${item._id}`)}
                      className="px-4 py-1.5 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Read More
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg transition-colors ${
                currentPage === 1
                  ? "opacity-50 cursor-not-allowed"
                  : isDarkMode
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              <FiChevronLeft className="w-5 h-5" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                  currentPage === page
                    ? "bg-purple-600 text-white"
                    : isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg transition-colors ${
                currentPage === totalPages
                  ? "opacity-50 cursor-not-allowed"
                  : isDarkMode
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              <FiChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Notification Details Modal */}
      {isNotificationModalOpen && notificationDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className={`rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col ${
              isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"
            }`}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  notificationDetails.type === "announcement"
                    ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30"
                    : "bg-green-100 text-green-600 dark:bg-green-900/30"
                }`}>
                  {getNotificationIcon(notificationDetails.type)}
                </div>
                <h3 className="text-xl font-bold">Notification Details</h3>
              </div>
              <button
                onClick={() => setIsNotificationModalOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto p-6 flex-1">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-3 rounded-lg ${
                    isDarkMode ? "bg-gray-700" : "bg-gray-50"
                  }`}>
                    <p className="text-xs text-gray-500 mb-1">Title</p>
                    <p className="font-medium">{notificationDetails.title}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${
                    isDarkMode ? "bg-gray-700" : "bg-gray-50"
                  }`}>
                    <p className="text-xs text-gray-500 mb-1">Type</p>
                    <p className="font-medium capitalize flex items-center gap-1">
                      {getNotificationIcon(notificationDetails.type)}
                      {notificationDetails.type === "auction-win" 
                        ? "Auction Win" 
                        : notificationDetails.type}
                    </p>
                  </div>
                </div>

                <div className={`p-3 rounded-lg ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-50"
                }`}>
                  <p className="text-xs text-gray-500 mb-1">Message</p>
                  <p className="whitespace-pre-line">{notificationDetails.message}</p>
                </div>

                <div className={`p-3 rounded-lg ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-50"
                }`}>
                  <p className="text-xs text-gray-500 mb-1">Received</p>
                  <p className="flex items-center gap-2">
                    <FiClock className="w-4 h-4" />
                    {new Date(notificationDetails.timestamp).toLocaleString()}
                  </p>
                </div>

                {notificationDetails.type === "auction-win" && 
                 notificationDetails.auctionData && (
                  <div className={`mt-4 p-4 rounded-lg ${
                    isDarkMode ? "bg-gray-700" : "bg-yellow-50"
                  }`}>
                    <h4 className="font-bold flex items-center gap-2 mb-3">
                      <FaCheckCircle className="text-green-500" />
                      Auction You Won
                    </h4>
                    <div className="space-y-2">
                      <p><span className="font-medium">Item:</span> {notificationDetails.auctionData.name}</p>
                      <p><span className="font-medium">Winning Bid:</span> ${notificationDetails.auctionData.currentBid?.toLocaleString()}</p>
                      <p><span className="font-medium">Seller:</span> {notificationDetails.auctionData.sellerDisplayName}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`p-4 border-t flex justify-end gap-3 ${
              isDarkMode ? "border-gray-700" : "border-gray-200"
            }`}>
              {notificationDetails.type === "auction-win" && (
                <button
                  onClick={() => {
                    navigate("/dashboard/payment", { 
                      state: { auctionData: notificationDetails.auctionData } 
                    });
                    setIsNotificationModalOpen(false);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Proceed to Payment
                </button>
              )}
              
              {notificationDetails.type === "announcement" && 
               notificationDetails.announcementData?._id && (
                <button
                  onClick={() => {
                    navigate(`/announcementDetails/${notificationDetails.announcementData._id}`);
                    setIsNotificationModalOpen(false);
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  View Full Announcement
                </button>
              )}
              
              <button
                onClick={() => setIsNotificationModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Announcement Modal */}
      {isAdmin && (
        <EditAnnouncementModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedAnnouncement(null);
          }}
          announcementData={selectedAnnouncement}
          refetch={refetch}
        />
      )}
    </div>
  );
};

export default Announcement;