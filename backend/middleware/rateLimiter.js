const rateLimit = require('express-rate-limit');

// Strict rate limiter for authorization endpoints
// Prevents brute force attacks on token verification
const authorizationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authorization attempts from this IP, please try again after 15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip successful requests (only count failed auth attempts)
  skipSuccessfulRequests: false,
  // Skip failed requests to not count toward limit (optional, set to true if you want to only count successful attempts)
  skipFailedRequests: false,
});

// Moderate rate limiter for general API endpoints
// Protects against API abuse while allowing normal usage
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Lenient rate limiter for static file serving
// Allows normal browsing while preventing DoS attacks
const staticFileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful static file requests to avoid limiting normal browsing
  skip: (req) => {
    // Don't rate limit requests for common static files if they're successful
    const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.woff2', '.ttf'];
    const hasStaticExtension = staticExtensions.some(ext => req.path.endsWith(ext));
    return hasStaticExtension && req.method === 'GET';
  }
});

module.exports = {
  authorizationLimiter,
  apiLimiter,
  staticFileLimiter,
};
