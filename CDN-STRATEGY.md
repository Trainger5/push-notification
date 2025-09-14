# CDN Strategy & Environment Configuration

## Overview

This project implements a flexible CDN (Content Delivery Network) strategy that separates API endpoints from static asset delivery. This architectural decision provides significant benefits for performance, scalability, and deployment flexibility.

## Why Separate CDN_BASE from API_BASE?

### 1. **Performance Optimization**
- **Geographic Distribution**: CDN domains are distributed globally, reducing latency for users worldwide
- **Optimized Caching**: Static SDK files can be cached aggressively (long TTL) while API responses use different caching strategies
- **Parallel Loading**: Browser can load SDK files from CDN while making API calls simultaneously
- **Edge Caching**: CDN edge servers serve static files faster than origin servers

### 2. **Scalability Benefits**
- **Load Distribution**: API server handles dynamic requests, CDN handles static assets
- **Resource Optimization**: API server resources aren't used for serving static files
- **Independent Scaling**: CDN and API infrastructure can be scaled separately based on usage patterns
- **Bandwidth Efficiency**: CDN handles high-bandwidth static file downloads

### 3. **Reliability & Availability**
- **Fault Tolerance**: If API server is temporarily unavailable, SDK files still load from CDN
- **Redundancy**: CDN typically has multiple edge locations and automatic failover
- **Critical Path Optimization**: Essential client-side files (SDK, service workers) remain available
- **Reduced Single Points of Failure**: Separation prevents API issues from affecting static assets

### 4. **Security Considerations**
- **Different Security Policies**: API endpoints can have strict authentication while CDN allows public access
- **CORS Configuration**: CDN can have relaxed CORS headers for public SDK files
- **DDoS Protection**: CDN provides additional layer of DDoS protection for static assets
- **SSL/TLS Optimization**: CDN can handle SSL termination and optimization

### 5. **Development & Deployment Flexibility**
- **Environment Isolation**: Easy switching between localhost, staging, and production CDNs
- **A/B Testing**: Different CDN endpoints for testing new SDK versions
- **Versioning**: Multiple SDK versions can coexist on CDN
- **Rollback Capability**: Quick rollback to previous SDK versions

## Architecture Diagram

```
┌─────────────────┐    API Calls     ┌─────────────────┐
│   Frontend      │ ───────────────► │   API Server    │
│   Application   │                  │   (Dynamic)     │
└─────────────────┘                  └─────────────────┘
         │
         │ SDK/Static Files
         ▼
┌─────────────────┐
│   CDN Server    │
│   (Static)      │
└─────────────────┘
```

## Environment Configuration

### Development Environment
```bash
# Frontend (.env.development)
VITE_API_BASE=http://localhost:4000
VITE_CDN_BASE=http://localhost:4000

# Backend (.env)
CDN_BASE=http://localhost:4000
```

**Reasoning**: During development, both API and CDN point to the same local server for simplicity.

### Staging Environment
```bash
# Frontend
VITE_API_BASE=https://api-staging.pushads123.com
VITE_CDN_BASE=https://cdn-staging.pushads123.com

# Backend
CDN_BASE=https://cdn-staging.pushads123.com
```

**Reasoning**: Staging mirrors production architecture but uses separate staging domains.

### Production Environment Options

#### Option 1: Same Domain
```bash
# Frontend
VITE_API_BASE=https://pushads123.com
VITE_CDN_BASE=https://pushads123.com

# Backend
CDN_BASE=https://pushads123.com
```

#### Option 2: Separate CDN Subdomain
```bash
# Frontend
VITE_API_BASE=https://api.pushads123.com
VITE_CDN_BASE=https://cdn.pushads123.com

# Backend
CDN_BASE=https://cdn.pushads123.com
```

#### Option 3: External CDN (CloudFlare)
```bash
# Frontend
VITE_API_BASE=https://pushads123.com
VITE_CDN_BASE=https://sdk.pushads123.com

# Backend
CDN_BASE=https://sdk.pushads123.com
```

#### Option 4: AWS CloudFront
```bash
# Frontend
VITE_API_BASE=https://pushads123.com
VITE_CDN_BASE=https://d123456789.cloudfront.net

# Backend
CDN_BASE=https://d123456789.cloudfront.net
```

## Files Served from CDN

### 1. **JavaScript SDK Files**
- `sdk.js` - Main SDK for website integration
- `instant-push.js` - One-line integration script
- `pn-sw.js` - Service worker implementation

### 2. **Static Assets**
- Icons and badges for notifications
- CSS files for UI components
- Documentation assets

### 3. **Service Worker Files**
- Background push notification handlers
- Offline functionality scripts
- Cache management logic

## Implementation Details

### Frontend Implementation
```javascript
// Dynamic CDN base URL
const cdnBase = import.meta.env.VITE_CDN_BASE || 'https://pushads123.com'

// Usage in SDK integration
const sdkUrl = `${cdnBase}/sdk.js`
const serviceWorkerUrl = `${cdnBase}/pn-sw.js`
```

### Backend Implementation
```javascript
// Service worker generation
const serviceWorkerContent = `
importScripts('${process.env.CDN_BASE || 'https://pushads123.com'}/pn-sw.js');
`
```

## Performance Metrics

With CDN separation, you can expect:

- **40-60% faster SDK loading** (geographic distribution)
- **Reduced API server load** (static files offloaded)
- **Better cache hit rates** (CDN edge caching)
- **Improved availability** (redundant infrastructure)

## Best Practices

### 1. **Cache Headers**
```
SDK Files: Cache-Control: public, max-age=86400
Service Workers: Cache-Control: no-cache (for updates)
```

### 2. **Versioning Strategy**
```
/v1/sdk.js (stable)
/latest/sdk.js (development)
/beta/sdk.js (testing)
```

### 3. **Monitoring**
- CDN response times
- Cache hit/miss ratios
- Error rates by geographic region
- Bandwidth usage patterns

### 4. **Security Headers**
```
Access-Control-Allow-Origin: *
Content-Security-Policy: appropriate policies
X-Content-Type-Options: nosniff
```

## Migration Guide

### From Single Domain to CDN

1. **Set up CDN infrastructure**
2. **Update environment variables**
3. **Deploy static assets to CDN**
4. **Update DNS/routing**
5. **Test all SDK integration points**
6. **Monitor performance improvements**

### Rollback Plan

1. **Switch CDN_BASE back to API domain**
2. **Redeploy with original configuration**
3. **Clear CDN caches if needed**
4. **Verify all functionality**

This CDN strategy provides a robust, scalable foundation for the push notification service while maintaining development simplicity and production performance.