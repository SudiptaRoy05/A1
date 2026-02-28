import React, { useContext, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ThemeContext from "../../Context/ThemeContext";
import useAxiosSecure from "../../../hooks/useAxiosSecure";
import useBidHistory from "../../../hooks/useBidHistory";
import useAuth from "../../../hooks/useAuth";
import {
  FaTrophy, FaMedal, FaClock, FaArrowUp, FaArrowDown,
  FaCreditCard, FaTimes, FaCheckCircle,
  FaMapMarkerAlt, FaUser, FaPhone, FaCity, FaFlag, FaTruck
} from "react-icons/fa";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Swal from 'sweetalert2';
import axios from 'axios';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51T5iidGW2GRcCE6kxgmcO7qvcJBftpXtyAImfuK8AM5DJ6o8xo1WzOPxe3olugysCWbZZ4kZmwYPcH7TLH6UMNsF00AHg3E1D6');

// API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Address Form Component
const AddressForm = ({ onNext, onClose, isDarkMode, bid }) => {
  const { dbUser } = useAuth();
  const [addressData, setAddressData] = useState({
    fullName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    deliveryInstructions: ''
  });

  const [errors, setErrors] = useState({});

  if (!bid) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">No bid information available</p>
      </div>
    );
  }

  useEffect(() => {
    if (dbUser) {
      setAddressData(prev => ({
        ...prev,
        fullName: dbUser?.name || dbUser?.fullName || prev.fullName,
        email: dbUser?.email || prev.email,
        phone: dbUser?.phone || prev.phone,
        addressLine1: dbUser?.addressLine1 || prev.addressLine1,
        addressLine2: dbUser?.addressLine2 || prev.addressLine2,
        city: dbUser?.city || prev.city,
        state: dbUser?.state || prev.state,
        postalCode: dbUser?.postalCode || prev.postalCode,
        country: dbUser?.country || prev.country
      }));
    }
  }, [dbUser]);

  const validateForm = () => {
    const newErrors = {};

    if (!addressData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!addressData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(addressData.email)) newErrors.email = 'Email is invalid';
    if (!addressData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!addressData.addressLine1.trim()) newErrors.addressLine1 = 'Address is required';
    if (!addressData.city.trim()) newErrors.city = 'City is required';
    if (!addressData.state.trim()) newErrors.state = 'State is required';
    if (!addressData.postalCode.trim()) newErrors.postalCode = 'Postal code is required';
    if (!addressData.country.trim()) newErrors.country = 'Country is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onNext(addressData);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAddressData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const inputClassName = `w-full px-4 py-3 rounded-lg border ${isDarkMode
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
    } focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`;

  const labelClassName = `block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`;

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
          <FaMapMarkerAlt className="text-purple-600" />
        </div>
        <div>
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Shipping Address
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Where should we deliver your item?
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClassName}>
              <FaUser className="inline mr-2" />
              Full Name *
            </label>
            <input
              type="text"
              name="fullName"
              value={addressData.fullName}
              onChange={handleChange}
              placeholder="John Doe"
              className={`${inputClassName} ${errors.fullName ? 'border-red-500' : ''}`}
            />
            {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
          </div>

          <div>
            <label className={labelClassName}>Email *</label>
            <input
              type="email"
              name="email"
              value={addressData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              className={`${inputClassName} ${errors.email ? 'border-red-500' : ''}`}
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
          </div>
        </div>

        <div>
          <label className={labelClassName}>
            <FaPhone className="inline mr-2" />
            Phone Number *
          </label>
          <input
            type="tel"
            name="phone"
            value={addressData.phone}
            onChange={handleChange}
            placeholder="+1 234 567 8900"
            className={`${inputClassName} ${errors.phone ? 'border-red-500' : ''}`}
          />
          {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
        </div>

        <div>
          <label className={labelClassName}>Address Line 1 *</label>
          <input
            type="text"
            name="addressLine1"
            value={addressData.addressLine1}
            onChange={handleChange}
            placeholder="123 Main Street"
            className={`${inputClassName} ${errors.addressLine1 ? 'border-red-500' : ''}`}
          />
          {errors.addressLine1 && <p className="mt-1 text-xs text-red-500">{errors.addressLine1}</p>}
        </div>

        <div>
          <label className={labelClassName}>Address Line 2 (Optional)</label>
          <input
            type="text"
            name="addressLine2"
            value={addressData.addressLine2}
            onChange={handleChange}
            placeholder="Apt, Suite, etc."
            className={inputClassName}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClassName}>
              <FaCity className="inline mr-2" />
              City *
            </label>
            <input
              type="text"
              name="city"
              value={addressData.city}
              onChange={handleChange}
              placeholder="New York"
              className={`${inputClassName} ${errors.city ? 'border-red-500' : ''}`}
            />
            {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city}</p>}
          </div>

          <div>
            <label className={labelClassName}>State *</label>
            <input
              type="text"
              name="state"
              value={addressData.state}
              onChange={handleChange}
              placeholder="NY"
              className={`${inputClassName} ${errors.state ? 'border-red-500' : ''}`}
            />
            {errors.state && <p className="mt-1 text-xs text-red-500">{errors.state}</p>}
          </div>

          <div>
            <label className={labelClassName}>Postal Code *</label>
            <input
              type="text"
              name="postalCode"
              value={addressData.postalCode}
              onChange={handleChange}
              placeholder="10001"
              className={`${inputClassName} ${errors.postalCode ? 'border-red-500' : ''}`}
            />
            {errors.postalCode && <p className="mt-1 text-xs text-red-500">{errors.postalCode}</p>}
          </div>
        </div>

        <div>
          <label className={labelClassName}>
            <FaFlag className="inline mr-2" />
            Country *
          </label>
          <input
            type="text"
            name="country"
            value={addressData.country}
            onChange={handleChange}
            placeholder="United States"
            className={`${inputClassName} ${errors.country ? 'border-red-500' : ''}`}
          />
          {errors.country && <p className="mt-1 text-xs text-red-500">{errors.country}</p>}
        </div>

        <div>
          <label className={labelClassName}>Delivery Instructions (Optional)</label>
          <textarea
            name="deliveryInstructions"
            value={addressData.deliveryInstructions}
            onChange={handleChange}
            rows="3"
            placeholder="Gate code, preferred delivery time, etc."
            className={inputClassName}
          />
        </div>

        <div className={`mt-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Order Summary
          </h3>
          <div className="flex justify-between items-center">
            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
              {bid?.auctionTitle}
            </span>
            <span className="text-xl font-bold text-purple-600">
              ${bid?.bidAmount?.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center mt-2 text-sm">
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
              Shipping
            </span>
            <span className="text-green-600">Free</span>
          </div>
        </div>

        <div className="flex gap-3 mt-6 sticky bottom-0 py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${isDarkMode
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
          >
            Continue to Payment
            <FaCreditCard />
          </button>
        </div>
      </form>
    </motion.div>
  );
};

// Stripe Payment Form Component
const StripePaymentForm = ({ addressData, onBack, onClose, bid, onPaymentSuccess, isDarkMode }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { dbUser } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);
  const axiosSecure = useAxiosSecure();

  if (!bid) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">No bid information available</p>
      </div>
    );
  }

  const getCountryCode = (countryName) => {
    if (!countryName) return 'US';

    const countryMap = {
      'bangladesh': 'BD',
      'united states': 'US',
      'usa': 'US',
      'canada': 'CA',
      'united kingdom': 'GB',
      'uk': 'GB',
      'india': 'IN',
      'australia': 'AU',
      'germany': 'DE',
      'france': 'FR',
      'japan': 'JP',
      'china': 'CN',
      'brazil': 'BR',
      'mexico': 'MX',
      'italy': 'IT',
      'spain': 'ES',
      'netherlands': 'NL',
      'russia': 'RU',
      'south korea': 'KR',
      'singapore': 'SG',
      'malaysia': 'MY',
      'thailand': 'TH',
      'vietnam': 'VN',
      'pakistan': 'PK',
      'sri lanka': 'LK',
      'nepal': 'NP',
      'philippines': 'PH',
      'indonesia': 'ID',
      'saudi arabia': 'SA',
      'uae': 'AE',
      'egypt': 'EG',
      'south africa': 'ZA'
    };

    const normalized = countryName.toLowerCase().trim();
    return countryMap[normalized] || countryName;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError("Stripe hasn't loaded properly. Please refresh the page.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const amountInCents = Math.round(bid.bidAmount * 100);

      console.log("Creating payment intent with:", {
        amount: amountInCents,
        auctionId: bid.auctionId,
        bidId: bid._id || bid.id
      });

      let response;
      try {
        response = await axiosSecure.post('/api/create-payment-intent', {
          amount: amountInCents,
          auctionId: bid.auctionId,
          bidId: bid._id || bid.id
        });
      } catch (err) {
        console.log("First attempt failed, trying with full URL...");
        response = await axios.post(`${API_URL}/api/create-payment-intent`, {
          amount: amountInCents,
          auctionId: bid.auctionId,
          bidId: bid._id || bid.id
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      }

      console.log("Payment intent response:", response.data);

      const cardElement = elements.getElement(CardElement);
      const countryCode = getCountryCode(addressData.country);

      const { error: stripeError, paymentIntent: confirmedPayment } = await stripe.confirmCardPayment(
        response.data.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: addressData.fullName,
              email: addressData.email,
              phone: addressData.phone,
              address: {
                line1: addressData.addressLine1,
                line2: addressData.addressLine2 || '',
                city: addressData.city,
                state: addressData.state,
                postal_code: addressData.postalCode,
                country: countryCode
              }
            }
          }
        }
      );

      if (stripeError) {
        console.error("Stripe error:", stripeError);
        setError(stripeError.message);
        setProcessing(false);
      } else if (confirmedPayment.status === 'succeeded') {
        try {
          const sellerEmail = bid.sellerEmail || bid.seller?.email || '';

          const paymentData = {
            paymentIntentId: confirmedPayment.id,
            auctionId: bid.auctionId,
            bidId: bid._id || bid.id,
            amount: bid.bidAmount,
            status: 'completed',
            paymentMethod: 'stripe',
            buyerInfo: {
              email: addressData.email,
              name: addressData.fullName,
              phone: addressData.phone,
              userId: dbUser?._id || dbUser?.id
            },
            sellerInfo: {
              email: sellerEmail,
              name: bid.sellerName || bid.seller?.name || ''
            },
            auctionDetails: {
              title: bid.auctionTitle,
              image: bid.auctionImage
            },
            shippingAddress: {
              fullName: addressData.fullName,
              addressLine1: addressData.addressLine1,
              addressLine2: addressData.addressLine2 || '',
              city: addressData.city,
              state: addressData.state,
              postalCode: addressData.postalCode,
              country: addressData.country,
              countryCode: countryCode,
              deliveryInstructions: addressData.deliveryInstructions || ''
            },
            buyerEmail: addressData.email,
            sellerEmail: sellerEmail,
            buyerName: addressData.fullName,
            auctionTitle: bid.auctionTitle,
            paymentDate: new Date().toISOString()
          };

          let saveResponse;
          try {
            saveResponse = await axiosSecure.post('/api/payments/save', paymentData);
          } catch (err) {
            saveResponse = await axios.post(`${API_URL}/api/payments/save`, paymentData, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
          }

          if (saveResponse.data.success) {
            await Swal.fire({
              icon: 'success',
              title: 'Payment Successful!',
              text: `Your payment of $${bid.bidAmount.toFixed(2)} has been processed.`,
              timer: 3000,
              showConfirmButton: true
            });

            onPaymentSuccess(bid, paymentData);
            onClose();
          } else {
            setError('Payment was successful but failed to save record.');
            setProcessing(false);
          }
        } catch (saveError) {
          console.error('Error saving payment:', saveError);
          setError('Payment succeeded but failed to save record.');
          setProcessing(false);
        }
      }
    } catch (err) {
      console.error('Payment error:', err);
      
      let errorMessage = 'Payment failed. ';
      if (err.response) {
        errorMessage += err.response.data?.message || err.response.statusText;
      } else if (err.request) {
        errorMessage += 'Server not responding. Please check your connection.';
      } else {
        errorMessage += err.message;
      }
      
      setError(errorMessage);
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: isDarkMode ? '#fff' : '#424770',
        '::placeholder': {
          color: isDarkMode ? '#9ca3af' : '#aab7c4',
        },
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a',
      },
    },
    hidePostalCode: true,
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
          <FaCreditCard className="text-purple-600" />
        </div>
        <div>
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Payment Details
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Enter your card information
          </p>
        </div>
      </div>

      <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
        <h3 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Shipping to:
        </h3>
        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {addressData.fullName}<br />
          {addressData.addressLine1}<br />
          {addressData.city}, {addressData.state} {addressData.postalCode}
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-2 text-sm text-purple-600 hover:text-purple-700"
        >
          Edit Address
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Card Details
          </label>
          <div className={`p-3 rounded-lg border ${isDarkMode
              ? 'bg-gray-700 border-gray-600'
              : 'bg-white border-gray-300'
            } focus-within:ring-2 focus-within:ring-purple-500`}>
            <CardElement
              options={cardElementOptions}
              onChange={(e) => setCardComplete(e.complete)}
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="sticky bottom-0 py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 -mx-6 px-6 mt-6">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onBack}
              disabled={processing}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${isDarkMode
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } disabled:opacity-50`}
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!stripe || processing || !cardComplete}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50"
            >
              {processing ? 'Processing...' : `Pay $${bid?.bidAmount?.toFixed(2)}`}
            </button>
          </div>
        </div>
      </form>
    </motion.div>
  );
};

// Main Payment Modal
const PaymentModal = ({ isOpen, onClose, bid, onPaymentSuccess }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [step, setStep] = useState(1);
  const [addressData, setAddressData] = useState(null);

  if (!isOpen) return null;

  const handleAddressNext = (data) => {
    setAddressData(data);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto bg-black bg-opacity-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className={`relative w-full max-w-2xl my-8 rounded-2xl shadow-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
            onClick={e => e.stopPropagation()}
          >
            <div className={`sticky top-0 z-10 flex justify-end p-4 rounded-t-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'
              } border-b border-gray-200 dark:border-gray-700`}>
              <button
                onClick={onClose}
                className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <FaTimes className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
              </button>
            </div>

            <div className={`sticky top-[72px] z-10 px-6 py-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'
              } border-b border-gray-200 dark:border-gray-700`}>
              <div className="flex items-center justify-between max-w-md mx-auto">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 1
                      ? 'bg-purple-600 text-white'
                      : isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'
                    }`}>
                    <FaMapMarkerAlt />
                  </div>
                  <div className="ml-2">
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Step 1</p>
                    <p className={`text-sm font-semibold ${step >= 1 ? 'text-purple-600' : ''}`}>Address</p>
                  </div>
                </div>

                <div className={`w-16 h-0.5 mx-2 ${step >= 2 ? 'bg-purple-600' : isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />

                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 2
                      ? 'bg-purple-600 text-white'
                      : isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'
                    }`}>
                    <FaCreditCard />
                  </div>
                  <div className="ml-2">
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Step 2</p>
                    <p className={`text-sm font-semibold ${step >= 2 ? 'text-purple-600' : ''}`}>Payment</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(100vh-250px)]">
              <AnimatePresence mode="wait">
                {step === 1 ? (
                  <AddressForm
                    key="address"
                    onNext={handleAddressNext}
                    onClose={onClose}
                    isDarkMode={isDarkMode}
                    bid={bid}
                  />
                ) : (
                  <Elements stripe={stripePromise}>
                    <StripePaymentForm
                      key="payment"
                      addressData={addressData}
                      onBack={handleBack}
                      onClose={onClose}
                      bid={bid}
                      onPaymentSuccess={onPaymentSuccess}
                      isDarkMode={isDarkMode}
                    />
                  </Elements>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Main AuctionStatus Component - FIXED for unique auctions
const AuctionStatus = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const { dbUser } = useAuth();
  const [filterStatus, setFilterStatus] = useState("All");
  const [bidHistory, refetch, isLoading] = useBidHistory();
  const [selectedBidForPayment, setSelectedBidForPayment] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paidAuctions, setPaidAuctions] = useState(new Set());
  const axiosSecure = useAxiosSecure();

  // Test server connection on mount
  useEffect(() => {
    const testServer = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/test`);
        console.log("Server test response:", response.data);
      } catch (error) {
        console.error("Server test failed:", error);
      }
    };
    testServer();
  }, []);

  // Fetch user's payment history
  useEffect(() => {
    const fetchUserPayments = async () => {
      if (dbUser?.email) {
        try {
          console.log("Fetching payments for:", dbUser.email);
          const response = await axiosSecure.get(`/api/payments/user/${dbUser.email}`);
          console.log("Payments response:", response.data);
          
          if (response.data.success) {
            const paidIds = new Set(response.data.payments.map(p => p.auctionId));
            setPaidAuctions(paidIds);
          }
        } catch (error) {
          console.error("Error fetching user payments:", error);
        }
      }
    };
    
    fetchUserPayments();
  }, [dbUser?.email, axiosSecure]);

  // Refresh bid history periodically
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  const openPaymentModal = (bid) => {
    setSelectedBidForPayment(bid);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async (bid, paymentData) => {
    try {
      setPaidAuctions(prev => new Set([...prev, bid.auctionId]));
      await refetch();
      setIsPaymentModalOpen(false);
      setSelectedBidForPayment(null);
      
      await Swal.fire({
        icon: 'success',
        title: 'Payment Successful!',
        text: 'Your payment has been processed.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Payment was successful but failed to update status.',
      });
    }
  };

  // ============ FIX: Group bids by auctionId to show unique auctions ============
  const uniqueAuctions = Array.isArray(bidHistory) 
    ? Object.values(
        bidHistory.reduce((acc, bid) => {
          // If this auction doesn't exist in accumulator, add it
          if (!acc[bid.auctionId]) {
            acc[bid.auctionId] = bid;
          } else {
            // If it exists, keep the one with highest bid amount
            const existingBid = acc[bid.auctionId];
            if (bid.bidAmount > existingBid.bidAmount) {
              acc[bid.auctionId] = bid; // Replace with higher bid
            } else if (bid.bidAmount === existingBid.bidAmount) {
              // If equal amounts, keep the most recent
              if (new Date(bid.time) > new Date(existingBid.time)) {
                acc[bid.auctionId] = bid;
              }
            }
          }
          return acc;
        }, {})
      )
    : [];

  // Now use uniqueAuctions instead of bidHistory for calculations
  const enhancedBids = uniqueAuctions.map(bid => {
    // Get all bids for this auction to calculate position correctly
    const allBidsForAuction = Array.isArray(bidHistory) 
      ? bidHistory.filter(b => b.auctionId === bid.auctionId)
      : [];
    
    const auctionBids = allBidsForAuction
      .sort((a, b) => b.bidAmount - a.bidAmount);

    const currentPosition = auctionBids.findIndex(b => b.id === bid.id) + 1;
    const totalBidders = auctionBids.length;
    const highestBid = auctionBids[0]?.bidAmount || 0;
    const isHighestBidder = currentPosition === 1;
    const bidDifference = highestBid - bid.bidAmount;

    let currentStatus = bid.status;
    let paymentRequired = false;

    const isPaid = paidAuctions.has(bid.auctionId);

    if (bid.status === "End" && isHighestBidder) {
      currentStatus = "Won";
      paymentRequired = !isPaid;
    } else if (bid.status === "End" && !isHighestBidder) {
      currentStatus = "Lost";
    } else if (bid.status !== "End") {
      if (isHighestBidder) {
        currentStatus = "Winning";
      } else if (bidDifference > 0) {
        currentStatus = "Outbid";
      } else {
        currentStatus = "Active";
      }
    }

    return {
      ...bid,
      currentPosition,
      totalBidders,
      highestBid,
      isHighestBidder,
      bidDifference,
      currentStatus,
      paymentRequired,
      paymentCompleted: isPaid,
      progress: totalBidders > 0 ? ((totalBidders - currentPosition + 1) / totalBidders) * 100 : 0,
      allBids: auctionBids // Store all bids if needed for reference
    };
  });

  const filteredBids = enhancedBids.filter((bid) => {
    if (filterStatus === "All") return true;
    if (filterStatus === "Winning") return bid.currentStatus === "Winning";
    if (filterStatus === "Outbid") return bid.currentStatus === "Outbid";
    if (filterStatus === "Won") return bid.currentStatus === "Won";
    if (filterStatus === "Lost") return bid.currentStatus === "Lost";
    if (filterStatus === "Payment Required") return bid.paymentRequired;
    return false;
  });

  const themeStyles = {
    background: isDarkMode ? "bg-gray-900" : "bg-gray-100",
    text: isDarkMode ? "text-white" : "text-gray-900",
    cardBg: isDarkMode ? "bg-gray-800" : "bg-white",
    border: isDarkMode ? "border-gray-700" : "border-gray-300",
    buttonBg: isDarkMode ? "bg-gray-700" : "bg-gray-200",
    buttonText: isDarkMode ? "text-white" : "text-gray-700",
    buttonHover: isDarkMode ? "hover:bg-gray-600" : "hover:bg-gray-300",
    activeFilterBg: "bg-purple-600",
    activeFilterText: "text-white",
  };

  const stats = {
    total: enhancedBids.length,
    winning: enhancedBids.filter(b => b.currentStatus === "Winning").length,
    outbid: enhancedBids.filter(b => b.currentStatus === "Outbid").length,
    won: enhancedBids.filter(b => b.currentStatus === "Won").length,
    lost: enhancedBids.filter(b => b.currentStatus === "Lost").length,
    paymentRequired: enhancedBids.filter(b => b.paymentRequired).length,
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className={`min-h-screen p-4 sm:p-6 ${themeStyles.background} ${themeStyles.text}`}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6">My Auction Status</h1>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <motion.div whileHover={{ scale: 1.02 }} className={`${themeStyles.cardBg} p-4 rounded-lg shadow-lg border-l-4 border-purple-500`}>
              <p className="text-sm opacity-75">Total Auctions</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} className={`${themeStyles.cardBg} p-4 rounded-lg shadow-lg border-l-4 border-green-500`}>
              <p className="text-sm opacity-75">Winning</p>
              <p className="text-2xl font-bold text-green-500">{stats.winning}</p>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} className={`${themeStyles.cardBg} p-4 rounded-lg shadow-lg border-l-4 border-yellow-500`}>
              <p className="text-sm opacity-75">Outbid</p>
              <p className="text-2xl font-bold text-yellow-500">{stats.outbid}</p>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} className={`${themeStyles.cardBg} p-4 rounded-lg shadow-lg border-l-4 border-blue-500`}>
              <p className="text-sm opacity-75">Won</p>
              <p className="text-2xl font-bold text-blue-500">{stats.won}</p>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} className={`${themeStyles.cardBg} p-4 rounded-lg shadow-lg border-l-4 border-red-500`}>
              <p className="text-sm opacity-75">Lost</p>
              <p className="text-2xl font-bold text-red-500">{stats.lost}</p>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} className={`${themeStyles.cardBg} p-4 rounded-lg shadow-lg border-l-4 border-orange-500`}>
              <p className="text-sm opacity-75">Payment Required</p>
              <p className="text-2xl font-bold text-orange-500">{stats.paymentRequired}</p>
            </motion.div>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            {[
              { label: "All", count: stats.total },
              { label: "Winning", count: stats.winning },
              { label: "Outbid", count: stats.outbid },
              { label: "Won", count: stats.won },
              { label: "Lost", count: stats.lost },
              { label: "Payment Required", count: stats.paymentRequired }
            ].map(({ label, count }) => (
              <motion.button
                key={label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilterStatus(label)}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  filterStatus === label
                    ? `${themeStyles.activeFilterBg} ${themeStyles.activeFilterText} shadow-lg`
                    : `${themeStyles.buttonBg} ${themeStyles.buttonText} ${themeStyles.buttonHover}`
                }`}
              >
                {label}
                {count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    filterStatus === label
                      ? "bg-white bg-opacity-20"
                      : label === "Winning" ? "bg-green-500 text-white" :
                        label === "Outbid" ? "bg-yellow-500 text-white" :
                          label === "Won" ? "bg-blue-500 text-white" :
                            label === "Lost" ? "bg-red-500 text-white" :
                              label === "Payment Required" ? "bg-orange-500 text-white" :
                                "bg-gray-500 text-white"
                  }`}>
                    {count}
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {filteredBids.map((bid) => (
              <motion.div
                key={bid.auctionId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`${themeStyles.cardBg} rounded-lg shadow-lg overflow-hidden border ${themeStyles.border}`}
              >
                <div className="p-4 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={bid.auctionImage || 'https://via.placeholder.com/80'}
                      alt={bid.auctionTitle}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div>
                      <h3 className="text-xl font-semibold">{bid.auctionTitle || 'Unnamed Auction'}</h3>
                      <p className="text-sm opacity-75">Auction ID: {bid.auctionId}</p>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    bid.currentStatus === "Winning" ? "bg-green-500 text-white" :
                      bid.currentStatus === "Outbid" ? "bg-yellow-500 text-white" :
                        bid.currentStatus === "Won" ? "bg-blue-500 text-white" :
                          bid.currentStatus === "Lost" ? "bg-red-500 text-white" :
                            bid.paymentRequired ? "bg-orange-500 text-white" :
                              "bg-gray-500 text-white"
                    }`}>
                    {bid.paymentRequired ? "Payment Required" : bid.currentStatus}
                  </span>
                </div>

                <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs opacity-75">Your Position</p>
                    <p className="text-xl font-bold">#{bid.currentPosition} of {bid.totalBidders}</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-75">Your Bid</p>
                    <p className="text-xl font-bold text-purple-600">${bid.bidAmount?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-75">Current Highest</p>
                    <p className="text-xl font-bold text-green-600">${bid.highestBid?.toFixed(2)}</p>
                  </div>
                  <div>
                    {bid.currentStatus === "Won" && !bid.paymentCompleted && (
                      <button
                        onClick={() => openPaymentModal(bid)}
                        className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-600"
                      >
                        Pay ${bid.bidAmount?.toFixed(2)}
                      </button>
                    )}
                    {bid.paymentCompleted && (
                      <div className="text-center text-green-500">
                        <FaCheckCircle className="inline mr-1" /> Paid
                      </div>
                    )}
                    {(bid.currentStatus === "Winning" || bid.currentStatus === "Outbid") && (
                      <button
                        onClick={() => window.location.href = `/liveBid/${bid.auctionId}`}
                        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
                      >
                        {bid.currentStatus === "Winning" ? "Place New Bid" : "Bid Higher"}
                      </button>
                    )}
                  </div>
                </div>

                {bid.currentStatus === "Won" && bid.paymentCompleted && (
                  <div className={`p-3 ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'} rounded-b-lg flex items-center gap-2 text-sm`}>
                    <FaTruck className="text-blue-500" />
                    <span className="text-green-600">Your product will arrive soon! 🚚</span>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredBids.length === 0 && (
            <div className={`${themeStyles.cardBg} p-8 text-center rounded-lg`}>
              <p className="text-lg opacity-75">No auctions found matching the selected filter.</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isPaymentModalOpen && selectedBidForPayment && (
          <PaymentModal
            isOpen={isPaymentModalOpen}
            onClose={() => {
              setIsPaymentModalOpen(false);
              setSelectedBidForPayment(null);
            }}
            bid={selectedBidForPayment}
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default AuctionStatus;