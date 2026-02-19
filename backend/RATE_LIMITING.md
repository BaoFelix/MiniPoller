# Rate Limiting Implementation

## Overview
This document describes the rate limiting implementation added to MiniPoller to address CodeQL security alerts regarding missing rate limiting on authorization and file system access endpoints.

## Security Alerts Addressed
1. **High Severity**: Authorization endpoint (`/polls/:pollId/end`) was not rate-limited, allowing potential brute force attacks
2. **High Severity**: Static file serving catch-all route was not rate-limited, allowing potential DoS attacks

## Implementation

### Rate Limiting Package
- **Package**: `express-rate-limit` v7.x
- **Location**: `backend/middleware/rateLimiter.js`

### Rate Limiting Strategies

#### 1. Authorization Limiter (Strictest)
- **Applied to**: `/api/polls/:pollId/end` endpoint
- **Limit**: 5 requests per 15 minutes per IP
- **Purpose**: Prevents brute force attacks on owner token verification
- **Location**: `backend/routes/apiRoutes.js` line 10

```javascript
// Applied to endPoll endpoint
router.post('/polls/:pollId/end', authorizationLimiter, apiController.endPoll);
```

#### 2. API Limiter (Moderate)
- **Applied to**: All `/api/*` routes
- **Limit**: 100 requests per 15 minutes per IP
- **Purpose**: Protects against API abuse while allowing normal usage
- **Location**: `backend/server.js` line 81

```javascript
app.use("/api", apiLimiter, apiRoutes(apiController));
```

#### 3. Static File Limiter (Lenient)
- **Applied to**: Catch-all route for static files
- **Limit**: 1000 requests per 15 minutes per IP
- **Purpose**: Prevents DoS attacks while allowing normal browsing
- **Special behavior**: Skips common static files (.js, .css, images) to avoid limiting normal usage
- **Location**: `backend/server.js` line 84

```javascript
app.get("*", staticFileLimiter, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});
```

## Rate Limit Response

When a rate limit is exceeded, the API returns:
- **Status Code**: 429 (Too Many Requests)
- **Headers**: 
  - `RateLimit-Limit`: Maximum number of requests allowed
  - `RateLimit-Remaining`: Number of requests remaining in current window
  - `RateLimit-Reset`: Time when the rate limit resets (Unix timestamp)
- **Response Body**: JSON error message

Example response:
```json
{
  "error": "Too many authorization attempts from this IP, please try again after 15 minutes"
}
```

## Configuration

Rate limits can be adjusted in `backend/middleware/rateLimiter.js`:

```javascript
const authorizationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Time window (15 minutes)
  max: 5,                    // Maximum requests per window
  message: { error: '...' }, // Error message
  standardHeaders: true,     // Include standard rate limit headers
  legacyHeaders: false,      // Disable legacy X-RateLimit-* headers
});
```

## Testing

### Manual Testing
1. Start the server: `npm run server`
2. Make repeated requests to test endpoints
3. Check for rate limit headers in responses
4. Verify 429 status code when limit exceeded

### Automated Testing
Run existing tests to ensure functionality: `npm test`

All existing tests pass with rate limiting enabled.

## Security Benefits

1. **Brute Force Protection**: The strict limit on authorization endpoints makes it impractical to guess owner tokens
2. **DoS Prevention**: Rate limiting on all routes prevents single IPs from overwhelming the server
3. **Resource Protection**: Prevents excessive resource consumption from malicious or misconfigured clients
4. **Compliance**: Addresses CodeQL security alerts and follows security best practices

## Monitoring

Rate limit information is included in response headers for monitoring:
- Track `RateLimit-Remaining` to see how close clients are to limits
- Monitor 429 responses to identify potential attacks or misconfigured clients
- Adjust limits based on actual usage patterns

## Future Enhancements

Potential improvements:
1. Use Redis for distributed rate limiting across multiple server instances
2. Implement different limits for authenticated vs anonymous users
3. Add more granular rate limiting per endpoint
4. Implement exponential backoff for repeated violations
5. Add IP whitelisting for trusted clients

## References
- [express-rate-limit Documentation](https://github.com/express-rate-limit/express-rate-limit)
- [OWASP Rate Limiting Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html#rate-limiting)
