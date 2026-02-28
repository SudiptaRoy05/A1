import React, { useContext, useEffect, useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PropTypes from "prop-types";
import ThemeContext from "../../Context/ThemeContext";
import useAxiosSecure from "../../../hooks/useAxiosSecure";
import useBidHistory from "../../../hooks/useBidHistory";
import useAuth from "../../../hooks/useAuth";
import {
  FaTrophy, FaMedal, FaClock, FaArrowUp, FaArrowDown,
  FaCreditCard, FaTimes, FaCheckCircle,
  FaMapMarkerAlt, FaUser, FaPhone, FaCity, FaFlag, FaTruck, FaSpinner
} from "react-icons/fa";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Swal from 'sweetalert2';

// Validate Stripe key at startup
const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
if (!stripeKey) {
  console.error('CRITICAL: Missing VITE_STRIPE_PUBLISHABLE_KEY environment variable');
}

// Initialize Stripe with environment variable
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

// Comprehensive country code mapping
const COUNTRY_CODE_MAP = {
  'afghanistan': 'AF', 'albania': 'AL', 'algeria': 'DZ', 'andorra': 'AD', 'angola': 'AO',
  'argentina': 'AR', 'armenia': 'AM', 'australia': 'AU', 'austria': 'AT', 'azerbaijan': 'AZ',
  'bahamas': 'BS', 'bahrain': 'BH', 'bangladesh': 'BD', 'barbados': 'BB', 'belarus': 'BY',
  'belgium': 'BE', 'belize': 'BZ', 'benin': 'BJ', 'bhutan': 'BT', 'bolivia': 'BO',
  'bosnia and herzegovina': 'BA', 'botswana': 'BW', 'brazil': 'BR', 'brunei': 'BN',
  'bulgaria': 'BG', 'burkina faso': 'BF', 'burundi': 'BI', 'cambodia': 'KH', 'cameroon': 'CM',
  'canada': 'CA', 'cape verde': 'CV', 'central african republic': 'CF', 'chad': 'TD',
  'chile': 'CL', 'china': 'CN', 'colombia': 'CO', 'comoros': 'KM', 'congo': 'CG',
  'costa rica': 'CR', 'croatia': 'HR', 'cuba': 'CU', 'cyprus': 'CY', 'czech republic': 'CZ',
  'denmark': 'DK', 'djibouti': 'DJ', 'dominica': 'DM', 'dominican republic': 'DO',
  'ecuador': 'EC', 'egypt': 'EG', 'el salvador': 'SV', 'equatorial guinea': 'GQ',
  'eritrea': 'ER', 'estonia': 'EE', 'eswatini': 'SZ', 'ethiopia': 'ET', 'fiji': 'FJ',
  'finland': 'FI', 'france': 'FR', 'gabon': 'GA', 'gambia': 'GM', 'georgia': 'GE',
  'germany': 'DE', 'ghana': 'GH', 'greece': 'GR', 'grenada': 'GD', 'guatemala': 'GT',
  'guinea': 'GN', 'guinea-bissau': 'GW', 'guyana': 'GY', 'haiti': 'HT', 'honduras': 'HN',
  'hungary': 'HU', 'iceland': 'IS', 'india': 'IN', 'indonesia': 'ID', 'iran': 'IR',
  'iraq': 'IQ', 'ireland': 'IE', 'israel': 'IL', 'italy': 'IT', 'jamaica': 'JM',
  'japan': 'JP', 'jordan': 'JO', 'kazakhstan': 'KZ', 'kenya': 'KE', 'kiribati': 'KI',
  'kuwait': 'KW', 'kyrgyzstan': 'KG', 'laos': 'LA', 'latvia': 'LV', 'lebanon': 'LB',
  'lesotho': 'LS', 'liberia': 'LR', 'libya': 'LY', 'liechtenstein': 'LI', 'lithuania': 'LT',
  'luxembourg': 'LU', 'madagascar': 'MG', 'malawi': 'MW', 'malaysia': 'MY', 'maldives': 'MV',
  'mali': 'ML', 'malta': 'MT', 'marshall islands': 'MH', 'mauritania': 'MR', 'mauritius': 'MU',
  'mexico': 'MX', 'micronesia': 'FM', 'moldova': 'MD', 'monaco': 'MC', 'mongolia': 'MN',
  'montenegro': 'ME', 'morocco': 'MA', 'mozambique': 'MZ', 'myanmar': 'MM', 'namibia': 'NA',
  'nauru': 'NR', 'nepal': 'NP', 'netherlands': 'NL', 'new zealand': 'NZ', 'nicaragua': 'NI',
  'niger': 'NE', 'nigeria': 'NG', 'north korea': 'KP', 'north macedonia': 'MK', 'norway': 'NO',
  'oman': 'OM', 'pakistan': 'PK', 'palau': 'PW', 'palestine': 'PS', 'panama': 'PA',
  'papua new guinea': 'PG', 'paraguay': 'PY', 'peru': 'PE', 'philippines': 'PH',
  'poland': 'PL', 'portugal': 'PT', 'qatar': 'QA', 'romania': 'RO', 'russia': 'RU',
  'rwanda': 'RW', 'saint kitts and nevis': 'KN', 'saint lucia': 'LC', 'saint vincent': 'VC',
  'samoa': 'WS', 'san marino': 'SM', 'sao tome and principe': 'ST', 'saudi arabia': 'SA',
  'senegal': 'SN', 'serbia': 'RS', 'seychelles': 'SC', 'sierra leone': 'SL', 'singapore': 'SG',
  'slovakia': 'SK', 'slovenia': 'SI', 'solomon islands': 'SB', 'somalia': 'SO',
  'south africa': 'ZA', 'south korea': 'KR', 'south sudan': 'SS', 'spain': 'ES',
  'sri lanka': 'LK', 'sudan': 'SD', 'suriname': 'SR', 'sweden': 'SE', 'switzerland': 'CH',
  'syria': 'SY', 'taiwan': 'TW', 'tajikistan': 'TJ', 'tanzania': 'TZ', 'thailand': 'TH',
  'timor-leste': 'TL', 'togo': 'TG', 'tonga': 'TO', 'trinidad and tobago': 'TT',
  'tunisia': 'TN', 'turkey': 'TR', 'turkmenistan': 'TM', 'tuvalu': 'TV', 'uganda': 'UG',
  'ukraine': 'UA', 'united arab emirates': 'AE', 'united kingdom': 'GB', 'uk': 'GB',
  'united states': 'US', 'usa': 'US', 'uruguay': 'UY', 'uzbekistan': 'UZ', 'vanuatu': 'VU',
  'vatican city': 'VA', 'venezuela': 'VE', 'vietnam': 'VN', 'yemen': 'YE', 'zambia': 'ZM',
  'zimbabwe': 'ZW'
};

// Helper function to get country code
const getCountryCode = (countryName) => {
  if (!countryName) return 'US';
  const normalized = countryName.toLowerCase().trim();
  return COUNTRY_CODE_MAP[normalized] || 'US';
};

// Sanitize input to prevent XSS
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.replace(/[<>]/g, '').trim();
};

// Loading Skeleton Component
const LoadingSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="animate-pulse">
        <div className="bg-gray-200 dark:bg-gray-700 h-32 rounded-lg"></div>
      </div>
    ))}
  </div>
);

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Please refresh the page or try again later.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Address Form Component - Bangladesh Only
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
    country: 'Bangladesh', // Fixed to Bangladesh
    deliveryInstructions: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  console.log('AddressForm - Bid data:', {
    auctionId: bid?.auctionId,
    auctionTitle: bid?.auctionTitle,
    bidAmount: bid?.bidAmount,
    sellerEmail: bid?.sellerEmail
  });

  // Validate bid data on mount
  useEffect(() => {
    if (!bid.sellerEmail) {
      console.error('AddressForm - Missing seller email:', bid);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Seller information is missing. Cannot proceed with payment.',
      }).then(() => {
        onClose();
      });
    }
    
    if (bid.bidAmount <= 0 || isNaN(bid.bidAmount)) {
      console.error('AddressForm - Invalid bid amount:', bid.bidAmount);
      Swal.fire({
        icon: 'error',
        title: 'Invalid Amount',
        text: 'Cannot process payment for invalid amount.',
      }).then(() => {
        onClose();
      });
    }
  }, [bid, onClose]);

  useEffect(() => {
    if (dbUser) {
      setIsLoading(true);
      try {
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
          country: 'Bangladesh' // Always set to Bangladesh
        }));
      } catch (error) {
        console.error('Error loading user data:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load user data. Please fill manually.',
        });
      } finally {
        setIsLoading(false);
      }
    }
  }, [dbUser]);

  // Bangladeshi phone number validation
  const validateBangladeshPhone = (phone) => {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    const bdPhoneRegex = /^(?:\+8801|01)[3-9]\d{8}$/;
    return bdPhoneRegex.test(cleaned);
  };

  // Bangladeshi postal code validation (4 digits)
  const validateBangladeshPostalCode = (postalCode) => {
    return /^\d{4}$/.test(postalCode);
  };

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!addressData.fullName.trim()) newErrors.fullName = 'Full name is required';
    
    if (!addressData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(addressData.email)) newErrors.email = 'Email is invalid';
    
    if (!addressData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validateBangladeshPhone(addressData.phone)) {
      newErrors.phone = 'Invalid Bangladesh phone number (e.g., 01XXXXXXXXX or +8801XXXXXXXXX)';
    }
    
    if (!addressData.addressLine1.trim()) newErrors.addressLine1 = 'Address is required';
    
    if (!addressData.city.trim()) newErrors.city = 'City/District is required';
    
    if (!addressData.state.trim()) newErrors.state = 'Division is required';
    
    if (!addressData.postalCode.trim()) {
      newErrors.postalCode = 'Postal code is required';
    } else if (!validateBangladeshPostalCode(addressData.postalCode)) {
      newErrors.postalCode = 'Postal code must be 4 digits (e.g., 1217)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [addressData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('AddressForm - Submitting address:', addressData);
    if (validateForm()) {
      onNext(addressData);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value);
    
    setAddressData(prev => ({
      ...prev,
      [name]: sanitizedValue
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
    } focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all disabled:opacity-50`;

  const labelClassName = `block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`;

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <FaSpinner className="animate-spin text-4xl text-purple-600 mx-auto mb-4" />
        <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Loading your information...</p>
      </div>
    );
  }

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
            Shipping Address - Bangladesh
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Please enter your Bangladesh address
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClassName} htmlFor="fullName">
              <FaUser className="inline mr-2" />
              Full Name *
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={addressData.fullName}
              onChange={handleChange}
              placeholder="John Doe / আপনার নাম"
              className={`${inputClassName} ${errors.fullName ? 'border-red-500' : ''}`}
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? "fullName-error" : undefined}
              disabled={isLoading}
            />
            {errors.fullName && (
              <p id="fullName-error" className="mt-1 text-xs text-red-500" role="alert">
                {errors.fullName}
              </p>
            )}
          </div>

          <div>
            <label className={labelClassName} htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={addressData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              className={`${inputClassName} ${errors.email ? 'border-red-500' : ''}`}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              disabled={isLoading}
            />
            {errors.email && (
              <p id="email-error" className="mt-1 text-xs text-red-500" role="alert">
                {errors.email}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className={labelClassName} htmlFor="phone">
            <FaPhone className="inline mr-2" />
            Phone Number (Bangladesh) *
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={addressData.phone}
            onChange={handleChange}
            placeholder="01XXXXXXXXX or +8801XXXXXXXXX"
            className={`${inputClassName} ${errors.phone ? 'border-red-500' : ''}`}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            disabled={isLoading}
          />
          {errors.phone && (
            <p id="phone-error" className="mt-1 text-xs text-red-500" role="alert">
              {errors.phone}
            </p>
          )}
        </div>

        <div>
          <label className={labelClassName} htmlFor="addressLine1">Address Line 1 *</label>
          <input
            type="text"
            id="addressLine1"
            name="addressLine1"
            value={addressData.addressLine1}
            onChange={handleChange}
            placeholder="House, Road, Area / বাড়ি, রাস্তা, এলাকা"
            className={`${inputClassName} ${errors.addressLine1 ? 'border-red-500' : ''}`}
            aria-invalid={!!errors.addressLine1}
            aria-describedby={errors.addressLine1 ? "address-error" : undefined}
            disabled={isLoading}
          />
          {errors.addressLine1 && (
            <p id="address-error" className="mt-1 text-xs text-red-500" role="alert">
              {errors.addressLine1}
            </p>
          )}
        </div>

        <div>
          <label className={labelClassName} htmlFor="addressLine2">Address Line 2 (Optional)</label>
          <input
            type="text"
            id="addressLine2"
            name="addressLine2"
            value={addressData.addressLine2}
            onChange={handleChange}
            placeholder="Village, Landmark / গ্রাম, ল্যান্ডমার্ক"
            className={inputClassName}
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClassName} htmlFor="city">
              <FaCity className="inline mr-2" />
              City/District *
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={addressData.city}
              onChange={handleChange}
              placeholder="e.g., Dhaka, Chittagong"
              className={`${inputClassName} ${errors.city ? 'border-red-500' : ''}`}
              aria-invalid={!!errors.city}
              aria-describedby={errors.city ? "city-error" : undefined}
              disabled={isLoading}
            />
            {errors.city && (
              <p id="city-error" className="mt-1 text-xs text-red-500" role="alert">
                {errors.city}
              </p>
            )}
          </div>

          <div>
            <label className={labelClassName} htmlFor="state">Division *</label>
            <input
              type="text"
              id="state"
              name="state"
              value={addressData.state}
              onChange={handleChange}
              placeholder="e.g., Dhaka, Chittagong, Rajshahi"
              className={`${inputClassName} ${errors.state ? 'border-red-500' : ''}`}
              aria-invalid={!!errors.state}
              aria-describedby={errors.state ? "state-error" : undefined}
              disabled={isLoading}
            />
            {errors.state && (
              <p id="state-error" className="mt-1 text-xs text-red-500" role="alert">
                {errors.state}
              </p>
            )}
          </div>

          <div>
            <label className={labelClassName} htmlFor="postalCode">Postal Code *</label>
            <input
              type="text"
              id="postalCode"
              name="postalCode"
              value={addressData.postalCode}
              onChange={handleChange}
              placeholder="e.g., 1217 (4 digits)"
              className={`${inputClassName} ${errors.postalCode ? 'border-red-500' : ''}`}
              aria-invalid={!!errors.postalCode}
              aria-describedby={errors.postalCode ? "postal-error" : undefined}
              disabled={isLoading}
            />
            {errors.postalCode && (
              <p id="postal-error" className="mt-1 text-xs text-red-500" role="alert">
                {errors.postalCode}
              </p>
            )}
          </div>
        </div>

        {/* Hidden country field - always Bangladesh */}
        <input type="hidden" name="country" value="Bangladesh" />

        <div>
          <label className={labelClassName} htmlFor="deliveryInstructions">Delivery Instructions (Optional)</label>
          <textarea
            id="deliveryInstructions"
            name="deliveryInstructions"
            value={addressData.deliveryInstructions}
            onChange={handleChange}
            rows="3"
            placeholder="Nearby landmark, preferred delivery time, gate code etc. / নিকটবর্তী ল্যান্ডমার্ক, পছন্দের ডেলিভারি সময়, গেট কোড ইত্যাদি"
            className={inputClassName}
            disabled={isLoading}
          />
        </div>

        <div className={`mt-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Order Summary
          </h3>
          <div className="flex justify-between items-center">
            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
              {bid?.auctionTitle || 'Auction Item'}
            </span>
            <span className="text-xl font-bold text-purple-600">
              ${bid?.bidAmount?.toFixed(2) || '0.00'}
            </span>
          </div>
          <div className="flex justify-between items-center mt-2 text-sm">
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
              Shipping to Bangladesh
            </span>
            <span className="text-green-600">Free</span>
          </div>
          <div className="flex justify-between items-center mt-2 text-xs">
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
              Seller: {bid?.sellerEmail || 'Not specified'}
            </span>
          </div>
        </div>

        <div className="flex gap-3 mt-6 sticky bottom-0 py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${isDarkMode
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } disabled:opacity-50`}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <FaSpinner className="animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Continue to Payment
                <FaCreditCard />
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

AddressForm.propTypes = {
  onNext: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  isDarkMode: PropTypes.bool.isRequired,
  bid: PropTypes.shape({
    auctionId: PropTypes.string.isRequired,
    auctionTitle: PropTypes.string,
    bidAmount: PropTypes.number.isRequired,
    sellerEmail: PropTypes.string.isRequired,
    auctionImage: PropTypes.string,
    _id: PropTypes.string,
    id: PropTypes.string
  }).isRequired
};

// Stripe Payment Form Component
const StripePaymentForm = ({ addressData, onBack, onClose, bid, onPaymentSuccess, isDarkMode }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { dbUser } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const axiosSecure = useAxiosSecure();
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Process retry queue on mount
  useEffect(() => {
    const processRetryQueue = async () => {
      try {
        const queue = JSON.parse(localStorage.getItem('paymentRetryQueue') || '[]');
        if (queue.length > 0) {
          console.log('Processing payment retry queue:', queue.length);
          
          for (const item of queue) {
            try {
              const response = await axiosSecure.post('/api/payments/save', item.paymentData);
              if (response.data.success) {
                // Remove from queue
                const updated = queue.filter(q => q.paymentIntentId !== item.paymentIntentId);
                localStorage.setItem('paymentRetryQueue', JSON.stringify(updated));
                
                // Show notification
                Swal.fire({
                  icon: 'info',
                  title: 'Payment Record Saved',
                  text: `Payment ${item.paymentIntentId.slice(-8)} has been successfully recorded.`,
                  timer: 3000,
                  toast: true,
                  position: 'top-end'
                });
              }
            } catch (error) {
              console.error('Retry failed for payment:', item.paymentIntentId);
            }
          }
        }
      } catch (error) {
        console.error('Error processing retry queue:', error);
      }
    };
    
    processRetryQueue();
  }, [axiosSecure]);

  console.log('StripePaymentForm - Bid and Address data:', {
    auctionId: bid?.auctionId,
    bidId: bid?._id || bid?.id,
    amount: bid?.bidAmount,
    sellerEmail: bid?.sellerEmail,
    addressData
  });

  // Validate bid data
  useEffect(() => {
    if (!bid.sellerEmail) {
      setError("Seller information is missing. Cannot process payment.");
      console.error('Missing seller email in bid:', bid);
    }
    
    if (bid.bidAmount <= 0) {
      setError("Invalid bid amount. Please contact support.");
    }
  }, [bid]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    console.log('StripePaymentForm - Starting payment submission for auction:', bid.auctionId);

    if (!stripe || !elements) {
      setError("Payment system is loading. Please wait a moment.");
      return;
    }

    if (!stripePromise) {
      setError("Payment system is not configured. Please contact support.");
      return;
    }

    if (bid.bidAmount <= 0) {
      setError("Invalid bid amount");
      return;
    }

    if (!bid.sellerEmail) {
      setError("Seller information is missing. Please contact support.");
      return;
    }

    setProcessing(true);
    setError(null);

    // Set timeout for payment
    const timeoutId = setTimeout(() => {
      if (isMounted.current) {
        setProcessing(false);
        setError("Payment timed out. Please try again.");
      }
    }, 30000);

    try {
      const amountInCents = Math.round(bid.bidAmount * 100);

      console.log('StripePaymentForm - Creating payment intent:', {
        amount: amountInCents,
        auctionId: bid.auctionId,
        bidId: bid._id || bid.id
      });

      const { data: paymentIntent } = await axiosSecure.post('/api/create-payment-intent', {
        amount: amountInCents,
        auctionId: bid.auctionId,
        bidId: bid._id || bid.id
      });

      if (!paymentIntent?.clientSecret) {
        throw new Error('Invalid payment intent response');
      }

      console.log('StripePaymentForm - Payment intent created:', paymentIntent.id);

      const cardElement = elements.getElement(CardElement);
      const countryCode = getCountryCode(addressData.country);

      const { error: stripeError, paymentIntent: confirmedPayment } = await stripe.confirmCardPayment(
        paymentIntent.clientSecret,
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

      clearTimeout(timeoutId);

      if (stripeError) {
        console.error('StripePaymentForm - Payment error:', stripeError);
        if (isMounted.current) {
          setError(stripeError.message);
          setProcessing(false);
        }
      } else if (confirmedPayment?.status === 'succeeded') {
        console.log('StripePaymentForm - Payment succeeded:', confirmedPayment.id);
        await handlePaymentSuccess(confirmedPayment, countryCode);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Payment error:', err);
      
      if (isMounted.current) {
        if (err.response?.status === 401) {
          setError('Session expired. Please login again.');
        } else if (err.response?.status === 400) {
          setError(err.response?.data?.message || 'Invalid payment request');
        } else {
          setError('Payment failed. Please try again.');
        }
        setProcessing(false);
      }
    }
  };

  const handlePaymentSuccess = async (confirmedPayment, countryCode) => {
    console.log('StripePaymentForm - Processing payment success for auction:', bid.auctionId);
    
    try {
      const paymentData = {
        paymentIntentId: confirmedPayment.id,
        auctionId: bid.auctionId,
        bidId: bid._id || bid.id,
        amount: bid.bidAmount,
        status: 'completed',
        paymentMethod: 'stripe',
        sellerEmail: bid.sellerEmail, // CRITICAL: Include seller email
        buyerInfo: {
          email: addressData.email,
          name: addressData.fullName,
          phone: addressData.phone,
          userId: dbUser?._id || dbUser?.id
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
        auctionTitle: bid.auctionTitle,
        paymentDate: new Date().toISOString()
      };

      console.log('StripePaymentForm - Saving payment record with seller email:', paymentData.sellerEmail);

      const saveResponse = await axiosSecure.post('/api/payments/save', paymentData);

      if (saveResponse.data.success) {
        console.log('StripePaymentForm - Payment record saved successfully');
        
        if (isMounted.current) {
          await Swal.fire({
            icon: 'success',
            title: 'Payment Successful!',
            text: `Your payment of $${bid.bidAmount.toFixed(2)} has been processed.`,
            timer: 3000,
            showConfirmButton: true
          });

          onPaymentSuccess(bid, paymentData);
          onClose();
        }
      } else {
        throw new Error(saveResponse.data.message || 'Failed to save payment record');
      }
    } catch (saveError) {
      console.error('Error saving payment:', saveError);
      
      if (isMounted.current) {
        // Add to retry queue
        try {
          const queue = JSON.parse(localStorage.getItem('paymentRetryQueue') || '[]');
          queue.push({
            paymentIntentId: confirmedPayment.id,
            paymentData: {
              paymentIntentId: confirmedPayment.id,
              auctionId: bid.auctionId,
              bidId: bid._id || bid.id,
              amount: bid.bidAmount,
              status: 'completed',
              paymentMethod: 'stripe',
              sellerEmail: bid.sellerEmail,
              buyerInfo: {
                email: addressData.email,
                name: addressData.fullName,
                phone: addressData.phone,
                userId: dbUser?._id || dbUser?.id
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
              auctionTitle: bid.auctionTitle,
              paymentDate: new Date().toISOString()
            },
            timestamp: new Date().toISOString()
          });
          localStorage.setItem('paymentRetryQueue', JSON.stringify(queue));
          
          await Swal.fire({
            icon: 'warning',
            title: 'Payment Processing',
            text: 'Payment succeeded but record saving will be retried automatically.',
            footer: `Payment ID: ${confirmedPayment.id.slice(-8)}`
          });
        } catch (queueError) {
          console.error('Error adding to retry queue:', queueError);
          
          await Swal.fire({
            icon: 'warning',
            title: 'Payment Processing',
            text: 'Payment succeeded but record saving failed. Please contact support with your payment ID.',
            footer: `Payment ID: ${confirmedPayment.id}`
          });
        }
        
        onPaymentSuccess(bid, { 
          ...bid, 
          paymentId: confirmedPayment.id,
          sellerEmail: bid.sellerEmail // Include seller email in fallback
        });
        onClose();
      }
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
          {addressData.addressLine2 && <>{addressData.addressLine2}<br /></>}
          {addressData.city}, {addressData.state} {addressData.postalCode}<br />
          {addressData.country}
        </p>
        <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Seller: {bid.sellerEmail}
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-2 text-sm text-purple-600 hover:text-purple-700 focus:outline-none focus:underline"
          disabled={processing}
        >
          Edit Address
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label 
            className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
            htmlFor="card-element"
          >
            Card Details
          </label>
          <div 
            className={`p-3 rounded-lg border ${isDarkMode
                ? 'bg-gray-700 border-gray-600'
                : 'bg-white border-gray-300'
              } focus-within:ring-2 focus-within:ring-purple-500`}
          >
            <CardElement
              id="card-element"
              options={cardElementOptions}
              onChange={(e) => {
                setCardComplete(e.complete);
                if (e.error) {
                  setError(e.error.message);
                } else {
                  setError(null);
                }
              }}
            />
          </div>
        </div>

        {error && (
          <div 
            className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm"
            role="alert"
          >
            {error}
            {retryCount < 3 && error.includes('timed out') && (
              <button
                type="button"
                onClick={() => {
                  setRetryCount(prev => prev + 1);
                  setError(null);
                }}
                className="ml-2 text-red-800 underline hover:no-underline"
              >
                Retry
              </button>
            )}
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
                } disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-purple-500`}
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!stripe || processing || !cardComplete || bid.bidAmount <= 0 || !bid.sellerEmail || !stripePromise}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-purple-500 flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay $${bid?.bidAmount?.toFixed(2) || '0.00'}`
              )}
            </button>
          </div>
        </div>
      </form>
    </motion.div>
  );
};

StripePaymentForm.propTypes = {
  addressData: PropTypes.object.isRequired,
  onBack: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  bid: PropTypes.shape({
    auctionId: PropTypes.string.isRequired,
    _id: PropTypes.string,
    id: PropTypes.string,
    bidAmount: PropTypes.number.isRequired,
    auctionTitle: PropTypes.string,
    auctionImage: PropTypes.string,
    sellerEmail: PropTypes.string.isRequired
  }).isRequired,
  onPaymentSuccess: PropTypes.func.isRequired,
  isDarkMode: PropTypes.bool.isRequired
};

// Main Payment Modal - FIXED VERSION
const PaymentModal = ({ isOpen, onClose, bid, onPaymentSuccess }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [step, setStep] = useState(1);
  const [addressData, setAddressData] = useState(null);

  console.log('PaymentModal - Bid data:', {
    auctionId: bid?.auctionId,
    auctionTitle: bid?.auctionTitle,
    bidAmount: bid?.bidAmount,
    sellerEmail: bid?.sellerEmail
  });

  // Validate bid data on mount and when bid changes
  useEffect(() => {
    if (isOpen && bid) {
      // Check for missing seller email
      if (!bid.sellerEmail) {
        console.error('PaymentModal - Missing seller email:', bid);
        onClose();
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Seller information is missing. Cannot process payment.',
        });
        return;
      }

      // Check for invalid bid amount
      if (!bid.bidAmount || bid.bidAmount <= 0 || isNaN(bid.bidAmount)) {
        console.error('PaymentModal - Invalid bid amount:', bid.bidAmount);
        onClose();
        Swal.fire({
          icon: 'error',
          title: 'Invalid Amount',
          text: 'Cannot process payment for invalid amount.',
        });
        return;
      }

      // Check for missing auction ID
      if (!bid.auctionId) {
        console.error('PaymentModal - Missing auction ID:', bid);
        onClose();
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Auction information is missing. Cannot process payment.',
        });
      }
    }
  }, [isOpen, bid, onClose]);

  // Check Stripe configuration
  useEffect(() => {
    if (isOpen && !stripePromise) {
      Swal.fire({
        icon: 'error',
        title: 'Configuration Error',
        text: 'Payment system is not configured. Please contact support.',
      }).then(() => {
        onClose();
      });
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAddressNext = (data) => {
    console.log('PaymentModal - Address data received:', data);
    setAddressData(data);
    setStep(2);
  };

  const handleBack = () => {
    console.log('PaymentModal - Going back to address step');
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
          role="dialog"
          aria-modal="true"
          aria-label="Payment Modal"
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
                className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                aria-label="Close modal"
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
                ) : stripePromise ? (
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
                ) : (
                  <div className="p-12 text-center">
                    <div className="text-red-500 text-xl mb-4">⚠️ Payment System Error</div>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      The payment system is not properly configured.
                    </p>
                    <button
                      onClick={onClose}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      Close
                    </button>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// FIXED PropTypes - Now properly validates required fields
PaymentModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  bid: PropTypes.shape({
    auctionId: PropTypes.string.isRequired,
    auctionTitle: PropTypes.string,
    bidAmount: PropTypes.number.isRequired,
    sellerEmail: PropTypes.string.isRequired,
    auctionImage: PropTypes.string,
    _id: PropTypes.string,
    id: PropTypes.string
  }).isRequired, // Made the whole object required
  onPaymentSuccess: PropTypes.func.isRequired
};

// Main AuctionStatus Component
const AuctionStatus = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const { dbUser } = useAuth();
  const [filterStatus, setFilterStatus] = useState("All");
  const [bidHistory, refetch, isLoading] = useBidHistory();
  const [selectedBidForPayment, setSelectedBidForPayment] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paidAuctions, setPaidAuctions] = useState(new Set());
  const [fetchError, setFetchError] = useState(null);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const axiosSecure = useAxiosSecure();

  console.log('AuctionStatus - User:', dbUser?.email);
  console.log('AuctionStatus - Raw bid history from backend:', bidHistory);

  const fetchUserPayments = useCallback(async () => {
    if (!dbUser?.email) return;
    
    setPaymentsLoading(true);
    try {
      setFetchError(null);
      console.log('AuctionStatus - Fetching payments for user:', dbUser.email);
      
      const response = await axiosSecure.get(`/api/payments/user/${dbUser.email}`);
      
      if (response.data.success) {
        const paidIds = new Set(response.data.payments.map(p => p.auctionId));
        setPaidAuctions(paidIds);
        console.log('AuctionStatus - Paid auctions:', Array.from(paidIds));
      } else {
        console.warn('Failed to fetch payments:', response.data.message);
      }
    } catch (error) {
      console.error("Error fetching user payments:", error);
      setFetchError("Failed to load payment history");
      
      if (error.response?.status === 404) {
        setPaidAuctions(new Set());
      }
    } finally {
      setPaymentsLoading(false);
    }
  }, [dbUser?.email, axiosSecure]);

  useEffect(() => {
    fetchUserPayments();
  }, [fetchUserPayments]);

  useEffect(() => {
    const interval = setInterval(() => {
      refetch().catch(error => {
        console.error('Error refetching bid history:', error);
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  // Enhanced bids with additional calculated fields
  const enhancedBids = useMemo(() => {
    console.log('AuctionStatus - Processing bid history, total bids:', bidHistory.length);
    
    return bidHistory.map(bid => {
      // Log warning if sellerEmail is missing
      if (!bid.sellerEmail) {
        console.warn(`Auction ${bid.auctionId} missing seller email`);
      }

      let currentStatus = bid.status || "Active";
      let paymentRequired = false;

      const isPaid = paidAuctions.has(bid.auctionId);

      if (currentStatus === "Won" && !isPaid) {
        paymentRequired = true;
      }

      console.log(`AuctionStatus - Auction ${bid.auctionId}:`, {
        title: bid.auctionTitle,
        bidAmount: bid.bidAmount,
        sellerEmail: bid.sellerEmail,
        backendStatus: bid.status,
        currentStatus,
        paymentRequired,
        isPaid,
        position: bid.position,
        totalBidders: bid.topBiddersLength,
        hasEnded: bid.hasEnded
      });

      return {
        ...bid,
        currentStatus,
        paymentRequired,
        paymentCompleted: isPaid,
        totalBidders: bid.topBiddersLength || 0,
        currentPosition: bid.position || 0,
        hasEnded: bid.hasEnded || false
      };
    });
  }, [bidHistory, paidAuctions]);

  // Log statistics after processing
  useEffect(() => {
    if (enhancedBids.length > 0) {
      const stats = {
        total: enhancedBids.length,
        winning: enhancedBids.filter(b => b.currentStatus === "Winning").length,
        outbid: enhancedBids.filter(b => b.currentStatus === "Outbid").length,
        won: enhancedBids.filter(b => b.currentStatus === "Won").length,
        lost: enhancedBids.filter(b => b.currentStatus === "Lost").length,
        active: enhancedBids.filter(b => b.currentStatus === "Active").length,
        paymentRequired: enhancedBids.filter(b => b.paymentRequired).length,
      };
      
      console.log('AuctionStatus - Final statistics:', stats);
    }
  }, [enhancedBids]);

  const filteredBids = useMemo(() => {
    return enhancedBids.filter((bid) => {
      if (filterStatus === "All") return true;
      if (filterStatus === "Winning") return bid.currentStatus === "Winning";
      if (filterStatus === "Outbid") return bid.currentStatus === "Outbid";
      if (filterStatus === "Won") return bid.currentStatus === "Won";
      if (filterStatus === "Lost") return bid.currentStatus === "Lost";
      if (filterStatus === "Active") return bid.currentStatus === "Active";
      if (filterStatus === "Payment Required") return bid.paymentRequired;
      return false;
    });
  }, [enhancedBids, filterStatus]);

  const openPaymentModal = (bid) => {
    console.log('AuctionStatus - Opening payment modal for auction:', {
      auctionId: bid.auctionId,
      title: bid.auctionTitle,
      amount: bid.bidAmount,
      sellerEmail: bid.sellerEmail
    });
    setSelectedBidForPayment(bid);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async (bid, paymentData) => {
    console.log('AuctionStatus - Payment successful for auction:', bid.auctionId, paymentData);
    
    try {
      const updatedPaymentData = {
        ...paymentData,
        sellerEmail: bid.sellerEmail // Ensure seller email is included
      };
      
      // Update local state immediately
      setPaidAuctions(prev => new Set([...prev, bid.auctionId]));
      
      // Wait for refetch to complete
      await refetch();
      
      // Close modal after everything is done
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
      
      // Still close modal but with warning
      setIsPaymentModalOpen(false);
      setSelectedBidForPayment(null);
      
      await Swal.fire({
        icon: 'warning',
        title: 'Payment Successful',
        text: 'Payment processed but failed to refresh data. Please refresh the page.',
      });
    }
  };

  const stats = useMemo(() => ({
    total: enhancedBids.length,
    winning: enhancedBids.filter(b => b.currentStatus === "Winning").length,
    outbid: enhancedBids.filter(b => b.currentStatus === "Outbid").length,
    won: enhancedBids.filter(b => b.currentStatus === "Won").length,
    lost: enhancedBids.filter(b => b.currentStatus === "Lost").length,
    active: enhancedBids.filter(b => b.currentStatus === "Active").length,
    paymentRequired: enhancedBids.filter(b => b.paymentRequired).length,
  }), [enhancedBids]);

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

  if (isLoading || paymentsLoading) {
    return (
      <div className={`min-h-screen p-4 sm:p-6 ${themeStyles.background} ${themeStyles.text}`}>
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`min-h-screen p-4 sm:p-6 ${themeStyles.background} ${themeStyles.text}`}>
        {fetchError && (
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg text-sm" role="alert">
            {fetchError}
          </div>
        )}

        {/* Debug info - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-4 bg-gray-800 text-white rounded-lg text-xs">
            <p className="font-bold mb-2">Debug Info:</p>
            <p>Total Bids: {enhancedBids.length}</p>
            <p>Winning: {stats.winning} | Won: {stats.won} | Lost: {stats.lost} | Active: {stats.active}</p>
            <p>Payment Required: {stats.paymentRequired}</p>
            <button 
              onClick={() => {
                console.log('Current enhanced bids:', enhancedBids);
                console.log('Paid auctions:', Array.from(paidAuctions));
              }}
              className="mt-2 px-2 py-1 bg-purple-600 rounded text-xs"
            >
              Log Bids to Console
            </button>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6">My Auction Status</h1>

          <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-6">
            <motion.div whileHover={{ scale: 1.02 }} className={`${themeStyles.cardBg} p-4 rounded-lg shadow-lg border-l-4 border-purple-500`}>
              <p className="text-sm opacity-75">Total Bids</p>
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

            <motion.div whileHover={{ scale: 1.02 }} className={`${themeStyles.cardBg} p-4 rounded-lg shadow-lg border-l-4 border-gray-500`}>
              <p className="text-sm opacity-75">Active</p>
              <p className="text-2xl font-bold text-gray-500">{stats.active}</p>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} className={`${themeStyles.cardBg} p-4 rounded-lg shadow-lg border-l-4 border-orange-500`}>
              <p className="text-sm opacity-75">Payment Required</p>
              <p className="text-2xl font-bold text-orange-500">{stats.paymentRequired}</p>
            </motion.div>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            {[
              { label: "All", count: stats.total },
              { label: "Winning", count: stats.winning, color: "green" },
              { label: "Outbid", count: stats.outbid, color: "yellow" },
              { label: "Won", count: stats.won, color: "blue" },
              { label: "Lost", count: stats.lost, color: "red" },
              { label: "Active", count: stats.active, color: "gray" },
              { label: "Payment Required", count: stats.paymentRequired, color: "orange" }
            ].map(({ label, count, color }) => (
              <motion.button
                key={label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilterStatus(label)}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  filterStatus === label
                    ? `${themeStyles.activeFilterBg} ${themeStyles.activeFilterText} shadow-lg`
                    : `${themeStyles.buttonBg} ${themeStyles.buttonText} ${themeStyles.buttonHover}`
                }`}
                aria-pressed={filterStatus === label}
              >
                {label}
                {count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    filterStatus === label
                      ? "bg-white bg-opacity-20"
                      : color === "green" ? "bg-green-500 text-white" :
                        color === "yellow" ? "bg-yellow-500 text-white" :
                          color === "blue" ? "bg-blue-500 text-white" :
                            color === "red" ? "bg-red-500 text-white" :
                              color === "gray" ? "bg-gray-500 text-white" :
                                color === "orange" ? "bg-orange-500 text-white" :
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
                className={`${themeStyles.cardBg} rounded-lg shadow-lg overflow-hidden border ${themeStyles.border} ${
                  bid.currentStatus === "Won" && !bid.paymentCompleted ? 'border-orange-500 border-2' : ''
                } ${bid.paymentCompleted ? 'border-green-500 border-2' : ''}`}
              >
                <div className="p-4 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={bid.auctionImage || 'https://via.placeholder.com/80'}
                      alt={bid.auctionTitle || 'Auction image'}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/80';
                      }}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div>
                      <h3 className="text-xl font-semibold">{bid.auctionTitle || 'Unnamed Auction'}</h3>
                      <p className="text-sm opacity-75">Auction ID: {bid.auctionId}</p>
                      <p className="text-xs opacity-50">Seller: {bid.sellerEmail || 'N/A'}</p>
                      {(bid.currentStatus === "Won" || bid.currentStatus === "Lost") && (
                        <p className="text-xs text-red-500 mt-1 font-semibold flex items-center gap-1">
                          <FaClock className="inline" /> Auction Ended
                        </p>
                      )}
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    bid.currentStatus === "Winning" ? "bg-green-500 text-white" :
                      bid.currentStatus === "Outbid" ? "bg-yellow-500 text-white" :
                        bid.currentStatus === "Won" ? "bg-blue-500 text-white" :
                          bid.currentStatus === "Lost" ? "bg-red-500 text-white" :
                            bid.currentStatus === "Active" ? "bg-gray-500 text-white" :
                              bid.paymentRequired ? "bg-orange-500 text-white" :
                                "bg-gray-500 text-white"
                  }`}>
                    {bid.paymentRequired ? "Payment Required" : bid.currentStatus}
                  </span>
                </div>

                <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs opacity-75">Your Position</p>
                    <p className="text-xl font-bold">#{bid.currentPosition || 'N/A'} of {bid.totalBidders || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-75">Your Bid</p>
                    <p className="text-xl font-bold text-purple-600">${bid.bidAmount?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-75">Status</p>
                    <p className="text-xl font-bold">{bid.currentStatus}</p>
                  </div>
                  <div>
                    {bid.currentStatus === "Won" && !bid.paymentCompleted && (
                      <button
                        onClick={() => openPaymentModal(bid)}
                        className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        Pay ${bid.bidAmount?.toFixed(2)}
                      </button>
                    )}
                    {bid.paymentCompleted && (
                      <div className="text-center text-green-500">
                        <FaCheckCircle className="inline mr-1" /> Paid
                      </div>
                    )}
                    {bid.currentStatus === "Winning" && (
                      <button
                        onClick={() => window.location.href = `/liveBid/${bid.auctionId}`}
                        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        Place New Bid
                      </button>
                    )}
                    {bid.currentStatus === "Outbid" && (
                      <button
                        onClick={() => window.location.href = `/liveBid/${bid.auctionId}`}
                        className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      >
                        Bid Higher
                      </button>
                    )}
                    {bid.currentStatus === "Lost" && (
                      <div className="text-center text-red-500">
                        Auction Ended
                      </div>
                    )}
                    {bid.currentStatus === "Active" && (
                      <button
                        onClick={() => window.location.href = `/liveBid/${bid.auctionId}`}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        View Auction
                      </button>
                    )}
                  </div>
                </div>

                {bid.currentStatus === "Won" && !bid.paymentCompleted && (
                  <div className={`p-3 ${isDarkMode ? 'bg-orange-900/20' : 'bg-orange-50'} rounded-b-lg flex items-center gap-2 text-sm`}>
                    <span className="text-orange-600">🎉 Congratulations! You won this auction. Complete payment to claim your item.</span>
                  </div>
                )}

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

        <AnimatePresence>
          {isPaymentModalOpen && selectedBidForPayment && (
            <PaymentModal
              isOpen={isPaymentModalOpen}
              onClose={() => {
                console.log('AuctionStatus - Closing payment modal');
                setIsPaymentModalOpen(false);
                setSelectedBidForPayment(null);
              }}
              bid={selectedBidForPayment}
              onPaymentSuccess={handlePaymentSuccess}
            />
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
};

export default AuctionStatus;