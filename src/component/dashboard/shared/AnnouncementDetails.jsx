import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { 
  FiArrowLeft, 
  FiCalendar, 
  FiShare2, 
  FiAlertCircle,
  FiClock,
  FiUser,
  FiTag,
  FiPaperclip,
  FiDownload
} from "react-icons/fi";
import ThemeContext from "../../../component/Context/ThemeContext";
import LoadingSpinner from "../../../component/LoadingSpinner";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const AnnouncementDetails = () => {
  const { id } = useParams();
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [notificationData, setNotificationData] = useState(null);

  useEffect(() => {
    // Check if notification data was passed via location state
    if (location.state?.notificationDetails) {
      setNotificationData(location.state.notificationDetails);

      // If the notification contains announcement data, use it directly
      if (location.state.notificationDetails.announcementData) {
        setAnnouncement(location.state.notificationDetails.announcementData);
        setLoading(false);
        return;
      }
    }

    // Fetch announcement by ID if no announcementData is provided
    if (id) {
      fetchAnnouncementDetails();
    } else {
      setError("No announcement ID provided.");
      setLoading(false);
    }
  }, [id, location.state]);

  const fetchAnnouncementDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching announcement with ID:", id);
      
      // Use the correct endpoint - now it exists in backend
      const response = await axios.get(`${API_BASE_URL}/announcement/${id}`, {
        withCredentials: true,
        timeout: 5000,
      });
      
      if (response.data) {
        console.log("✅ Successfully fetched announcement");
        setAnnouncement(response.data);
      } else {
        throw new Error("No data received from server");
      }
      
    } catch (err) {
      console.error("Error fetching announcement details:", err);
      
      if (err.response?.status === 404) {
        setError("Announcement not found. It may have been deleted or the link is incorrect.");
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError("Request timed out. Please check your connection and try again.");
      } else if (!err.response) {
        setError(`Cannot connect to server at ${API_BASE_URL}. Please make sure the server is running.`);
      } else {
        setError("Failed to load announcement details. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    fetchAnnouncementDetails();
  };

  const handleGoBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/announcements');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Date not available";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error || !announcement) {
    return (
      <div
        className={`min-h-screen ${
          isDarkMode ? "bg-gray-900 text-white" : "bg-purple-50 text-gray-800"
        } p-6`}
      >
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleGoBack}
            className={`flex items-center gap-2 mb-6 px-4 py-2 rounded-lg ${
              isDarkMode
                ? "bg-gray-800 hover:bg-gray-700"
                : "bg-white hover:bg-gray-100"
            } transition-colors`}
          >
            <FiArrowLeft /> Back
          </button>
          
          <div className="text-center py-12 px-4">
            <div className="flex justify-center mb-6">
              <FiAlertCircle className="text-6xl text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-red-500 mb-4">
              {error?.includes("not found") ? "Announcement Not Found" : "Error Loading Announcement"}
            </h2>
            <p className="mb-6 text-gray-500 dark:text-gray-400">
              {error || "The announcement you're looking for doesn't exist or has been removed."}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleRetry}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/announcements')}
                className="px-6 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Browse All Announcements
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-purple-50 text-gray-800"
      } p-6`}
    >
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={handleGoBack}
          className={`flex items-center gap-2 mb-6 px-4 py-2 rounded-lg ${
            isDarkMode
              ? "bg-gray-800 hover:bg-gray-700"
              : "bg-white hover:bg-gray-100"
          } transition-colors`}
        >
          <FiArrowLeft /> Back to Announcements
        </button>

        {/* Notification Info (if from notification) */}
        {notificationData && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            } shadow-md border-l-4 border-purple-500`}
          >
            <h3 className="text-lg font-semibold mb-3 text-purple-500 flex items-center gap-2">
              <FiBell className="text-purple-500" />
              Notification Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm flex items-center gap-2">
                  <FiUser className="text-gray-400" />
                  <span className="font-medium">From:</span>{" "}
                  {notificationData.sender || "System"}
                </p>
                <p className="text-sm flex items-center gap-2">
                  <FiClock className="text-gray-400" />
                  <span className="font-medium">Sent:</span>{" "}
                  {new Date(notificationData.timestamp || notificationData.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Title:</span>{" "}
                  {notificationData.title}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Message:</span>{" "}
                  {notificationData.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Announcement Header */}
        <div className="mb-8">
          <h1
            className={`text-3xl md:text-4xl font-bold mb-4 ${
              isDarkMode
                ? "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500"
                : "text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-700"
            }`}
          >
            {announcement.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <FiCalendar className="text-purple-500" />
              <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                {formatDate(announcement.date || announcement.createdAt || announcement.publishedAt)}
              </span>
            </div>
            
            <button
              onClick={handleShare}
              className="flex items-center gap-2 text-purple-500 hover:text-purple-600 transition-colors"
              aria-label="Share announcement"
            >
              <FiShare2 /> Share
            </button>

            {announcement.targetAudience && (
              <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs ${
                isDarkMode 
                  ? "bg-purple-900/50 text-purple-300" 
                  : "bg-purple-100 text-purple-700"
              }`}>
                <FiTag className="text-xs" />
                {announcement.targetAudience}
              </span>
            )}
          </div>
        </div>

        {/* Featured Image */}
        {announcement.image || announcement.files?.[0]?.url ? (
          <div className="mb-8 rounded-xl overflow-hidden shadow-lg">
            <img
              src={announcement.image || announcement.files?.[0]?.url}
              alt={announcement.title}
              className="w-full h-auto max-h-96 object-cover hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/800x400?text=Image+Not+Available";
              }}
            />
          </div>
        ) : null}

        {/* Content */}
        <div
          className={`prose max-w-none ${
            isDarkMode ? "prose-invert" : ""
          } mb-12`}
        >
          <div className="text-lg leading-relaxed whitespace-pre-line">
            {announcement.content}
          </div>
        </div>

        {/* Files/Attachments */}
        {announcement.files && announcement.files.length > 0 && (
          <div className="mt-8 mb-12">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FiPaperclip className="text-purple-500" />
              Attachments ({announcement.files.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {announcement.files.map((file, index) => (
                <a
                  key={index}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    isDarkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-white hover:bg-gray-100"
                  } transition-all duration-300 shadow-sm hover:shadow-md`}
                >
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                    <FiDownload className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium truncate">{file.name || `Attachment ${index + 1}`}</p>
                    <p className="text-xs text-gray-500">Click to download</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Related Announcements (optional) */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold mb-4">Need Help?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/announcements')}
              className={`p-4 rounded-lg text-left ${
                isDarkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-white hover:bg-gray-100"
              } transition-all duration-300 shadow-sm hover:shadow-md`}
            >
              <h4 className="font-semibold text-purple-500 mb-1">Browse All Announcements</h4>
              <p className="text-sm text-gray-500">
                View all recent announcements and updates
              </p>
            </button>
            
            <button
              onClick={() => navigate('/contact')}
              className={`p-4 rounded-lg text-left ${
                isDarkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-white hover:bg-gray-100"
              } transition-all duration-300 shadow-sm hover:shadow-md`}
            >
              <h4 className="font-semibold text-purple-500 mb-1">Contact Support</h4>
              <p className="text-sm text-gray-500">
                Get help with any questions or issues
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementDetails;