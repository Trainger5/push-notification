const rateLimit = require('express-rate-limit');

// Helper function to generate proper keys for IPv6 compatibility
const generateKey = (req) => {
  if (req.user?.userId) {
    return req.user.userId;
  }
  // Use the built-in IP handling which properly handles IPv6
  return req.ip;
};

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Rate limiter for registration
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 registration attempts per hour
  message: 'Too many accounts created from this IP, please try again after an hour.',
});

// Rate limiter for sending notifications
const notificationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit to 10 notification sends per minute
  message: 'Too many notifications sent, please slow down.',
  // Remove custom keyGenerator to use default IP handling
});

// Rate limiter for subscription endpoints
const subscriptionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit to 30 subscription operations per minute
  message: 'Too many subscription requests, please try again later.',
});

// Dynamic rate limiter based on customer plan
const planBasedLimiter = (req, res, next) => {
  // This can be enhanced to check customer plan from database
  const plan = req.user?.plan || 'free';
  
  const limits = {
    free: { windowMs: 60 * 60 * 1000, max: 100 }, // 100 requests per hour
    starter: { windowMs: 60 * 60 * 1000, max: 500 }, // 500 requests per hour
    pro: { windowMs: 60 * 60 * 1000, max: 2000 }, // 2000 requests per hour
    enterprise: { windowMs: 60 * 60 * 1000, max: 10000 }, // 10000 requests per hour
  };
  
  const limit = limits[plan] || limits.free;
  
  const limiter = rateLimit({
    windowMs: limit.windowMs,
    max: limit.max,
    message: `Rate limit exceeded for ${plan} plan. Please upgrade for higher limits.`,
    // Remove custom keyGenerator to use default IP handling
  });
  
  limiter(req, res, next);
};

module.exports = {
  apiLimiter,
  authLimiter,
  registrationLimiter,
  notificationLimiter,
  subscriptionLimiter,
  planBasedLimiter
};