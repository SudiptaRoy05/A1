"use client";

import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { toast, Toaster } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import {
  setUser,
  toggleLoading,
  setErrorMessage,
} from "../redux/features/user/userSlice";
import { signInWithEmailAndPassword } from "firebase/auth";
import auth from "../firebase/firebase.init";
import ForgotPasswordModal from "./ForgotPasswordModal";
import SocialLogin from "../component/SocialLogin";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { loading, errorMessage } = useSelector((state) => state.userSlice);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // Load saved email if available
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleEmailPasswordLogin = async (e) => {
    e.preventDefault();
    dispatch(toggleLoading(true));
    dispatch(setErrorMessage(null));

    // Save email if remember me is checked
    if (rememberMe) {
      localStorage.setItem("rememberedEmail", email);
    } else {
      localStorage.removeItem("rememberedEmail");
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      dispatch(
        setUser({
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          role: "buyer",
          AuctionsWon: 0,
          ActiveBids: 0,
          TotalSpent: 0,
          AccountBalance: 0,
          BiddingHistory: 0,
          onGoingBid: 0,
          location: "",
          memberSince: new Date().toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          }),
        })
      );

      navigate("/");
      toast.success("Login successful");
    } catch (err) {
      console.error("Login error:", err.code, err.message);
      
      // Handle specific Firebase error codes
      switch (err.code) {
        case "auth/user-not-found":
          dispatch(setErrorMessage("User not found. Please check your email or sign up."));
          toast.error("User not found. Please check your email or sign up.", {
            duration: 4000,
            icon: "❓",
            style: {
              background: "#fff3e0",
              color: "#e65100",
              border: "1px solid #ffb74d"
            }
          });
          break;
          
        case "auth/invalid-credential":
        case "auth/wrong-password":
          dispatch(setErrorMessage("Incorrect password. Please try again."));
          toast.error("Incorrect password. Please try again.", {
            duration: 3000,
            icon: "🔑",
            style: {
              background: "#ffebee",
              color: "#c62828",
              border: "1px solid #ef9a9a"
            }
          });
          break;
          
        case "auth/invalid-email":
          dispatch(setErrorMessage("Invalid email format. Please enter a valid email."));
          toast.error("Invalid email format", {
            duration: 3000,
            icon: "📧",
            style: {
              background: "#ffebee",
              color: "#c62828"
            }
          });
          break;
          
        case "auth/user-disabled":
          dispatch(setErrorMessage("This account has been disabled. Contact support."));
          toast.error("Account disabled", {
            duration: 4000,
            icon: "🚫",
            style: {
              background: "#ffebee",
              color: "#c62828"
            }
          });
          break;
          
        case "auth/too-many-requests":
          dispatch(setErrorMessage("Too many failed attempts. Try again later."));
          toast.error("Too many attempts. Please try again later.", {
            duration: 4000,
            icon: "⏳",
            style: {
              background: "#fff3e0",
              color: "#e65100"
            }
          });
          break;
          
        case "auth/network-request-failed":
          dispatch(setErrorMessage("Network error. Check your internet connection."));
          toast.error("Network error. Please check your internet connection.", {
            duration: 4000,
            icon: "🌐",
            style: {
              background: "#e3f2fd",
              color: "#1565c0"
            }
          });
          break;
          
        default:
          dispatch(
            setErrorMessage("Login failed. Please check your credentials and try again.")
          );
          toast.error("Login failed. Please try again.", {
            duration: 3000,
            icon: "❌"
          });
      }
    } finally {
      dispatch(toggleLoading(false));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
    
      <Toaster 
        position="top-center"
        toastOptions={{
          success: {
            style: {
              background: "#e8f5e8",
              color: "#2e7d32",
              border: "1px solid #a5d6a7"
            },
            icon: "✅",
          },
          error: {
            style: {
              background: "#ffebee",
              color: "#c62828",
              border: "1px solid #ef9a9a"
            },
            duration: 4000,
          },
        }}
      />
      
      <ForgotPasswordModal
        showModal={showForgotPassword}
        setShowModal={setShowForgotPassword}
      />

      {/* Background shapes */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-r from-blue-800 to-purple-900 rounded-bl-full opacity-80"></div>
      <div className="absolute bottom-0 left-0 w-2/3 h-1/3 bg-gradient-to-r from-blue-400 to-purple-900 rounded-tr-full opacity-80"></div>
      <div className="absolute bottom-0 right-0 w-1/4 h-1/4 bg-gradient-to-r from-gray-800 to-purple-900 rounded-tl-full opacity-70"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md px-6 py-10 sm:px-10"
      >
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden p-8 relative">
          {/* Back to Home Icon */}
          <div className="absolute top-7 left-3 py-2 px-3 bg-gradient-to-r from-gray-900 to-purple-500 hover:bg-purple-600 rounded-md">
            <Link
              to="/"
              className="flex items-center gap-1 text-gray-600 hover:text-black transition"
            >
              <ArrowLeft className="text-white" size={30} />
            </Link>
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600">Hey! Good to see you again</p>
          </div>

          <form onSubmit={handleEmailPasswordLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  className="pl-10 w-full px-4 py-3 rounded-full border border-gray-300 bg-white text-gray-800 focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  className="pl-10 w-full px-4 py-3 rounded-full border border-gray-300 bg-white text-gray-800 focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Remember me
                </label>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-purple-800 hover:text-purple-800 hover:underline transition-colors font-medium"
              >
                Forgot password?
              </button>
            </div>

            {/* Error Message Display */}
            {errorMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-lg border text-sm ${
                  errorMessage.includes("not found") 
                    ? "bg-orange-50 border-orange-200 text-orange-700" 
                    : errorMessage.includes("password")
                    ? "bg-red-50 border-red-200 text-red-700"
                    : errorMessage.includes("network")
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  {errorMessage.includes("not found") && (
                    <span className="text-xl">❓</span>
                  )}
                  {errorMessage.includes("password") && (
                    <span className="text-xl">🔑</span>
                  )}
                  {errorMessage.includes("network") && (
                    <span className="text-xl">🌐</span>
                  )}
                  <span>{errorMessage}</span>
                </div>
              </motion.div>
            )}

            <motion.button
              type="submit"
              className="w-full py-3 px-4 flex justify-center items-center rounded-full text-white font-semibold text-lg transition duration-300 bg-gradient-to-r from-gray-900 to-purple-500 hover:bg-purple-600 disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  Signing In...
                </>
              ) : (
                "SIGN IN"
              )}
            </motion.button>

            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <NavLink
                  to="/register"
                  className="text-purple-600 hover:text-purple-800 font-medium"
                >
                  Sign up
                </NavLink>
              </p>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <SocialLogin />
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;