# Military Vehicle Tracking - Cost Structure Analysis

## Executive Summary

This document provides a comprehensive cost analysis for implementing military vehicle tracking across air and sea domains. The analysis covers API pricing, usage scenarios, and recommendations for cost-effective implementation.

---

## 1. API Pricing Research

### 1.1 Flight Tracking APIs

#### FlightAware AeroAPI
- **Free Tier**: $5/month free credit
- **Commercial Plans**:
  - **Standard**: $100/month for ~10,000 API calls (B2C)
  - **Advanced**: $1,000/month for ~100,000 API calls (B2B)
- **Pricing Model**: Result-set based (15 results = 1 result set)
- **Notes**: Price varies by endpoint; actual calls may cost more depending on data returned
- **Best For**: Commercial applications with moderate traffic

#### FlightRadar24 API
- **Explorer**: $9/month for 30,000 data credits
- **Higher Tiers**: Up to $900/month for 4,050,000 credits
- **Enterprise**: Custom pricing for data feeds
- **Notes**: 2x credits promotion available (ending Nov 2025)
- **Best For**: Budget-conscious implementations

#### AviationStack
- **Free**: 100 API calls/month
- **Basic**: $49.99/month for 10,000 calls
- **Professional**: $149.99/month for 100,000 calls
- **Enterprise**: $499.99/month for 250,000 calls
- **Notes**: Simple pricing, generous free tier
- **Best For**: Startups and small-scale deployments

#### OpenSky Network
- **Free Tier**:
  - Anonymous: 100 calls/day
  - Authenticated: 4,000 calls/day
  - Data feeders: 8,000 calls/day
- **Commercial**: Requires explicit consent and custom licensing
- **Notes**: FREE for research/non-commercial use only
- **Best For**: Non-commercial proof-of-concept

#### ADS-B Exchange
- **Status**: Free tier discontinued as of March 2025
- **Current**: Low-cost API via RapidAPI (pricing not publicly listed)
- **Notes**: Previously offered generous free tier
- **Best For**: Not recommended due to unclear pricing

### 1.2 Maritime Tracking APIs

#### MarineTraffic
- **Pricing**: Custom quotes (not publicly listed)
- **Factors Affecting Cost**:
  - Number of vessels tracked (>25 vessels = discounts)
  - API request frequency
  - Response type (simple/extended/full)
  - Data source (Terrestrial/Satellite)
- **Plans**: 3 editions with varying features
- **Notes**: Must contact sales for pricing
- **Best For**: Enterprise deployments with specific requirements

#### VesselFinder
- **Model**: Credit-based system
- **Credits**: Valid for 12 months
- **Notes**: No free tier; pricing not publicly listed
- **Best For**: Pay-as-you-go maritime tracking

#### Datalastic
- **Trial**: €9 (14-day trial)
- **Starter**: €199/month (20,000 database requests)
- **Developer**: Mid-tier pricing
- **Pro+**: €679/month (unlimited usage)
- **Annual Discount**: 10% off
- **Coverage**: 800,000+ vessels, 22,000+ ports
- **Pricing Model**: 1 vessel position = 1 credit
- **Notes**: All plans access all endpoints
- **Best For**: Transparent pricing, self-service

#### AISHub
- **Cost**: FREE
- **Requirements**:
  - Share your own AIS feed
  - Coverage of 10+ vessels (7-day average)
  - 90% uptime (7-day average)
- **Rate Limit**: 1 request per minute
- **Formats**: XML, JSON, CSV
- **Notes**: Community data-sharing network
- **Best For**: Low-cost implementations if you can contribute data

---

## 2. Supabase Infrastructure Costs

### 2.1 Pricing Tiers

#### Free Tier
- **Cost**: $0/month
- **Database**: 500 MB storage
- **Database Egress**: 2 GB/month
- **File Storage**: 1 GB
- **Storage Egress**: 2 GB/month
- **MAU**: 50,000
- **Edge Functions**: 500,000 invocations
- **Limitations**:
  - Auto-pause after 7 days inactivity
  - 2 projects max
- **Best For**: Development/testing

#### Pro Tier
- **Base Cost**: $25/month
- **Included**:
  - Database: 8 GB storage
  - Database Egress: 50 GB
  - File Storage: 100 GB
  - Storage Egress: 250 GB
  - MAU: 100,000
- **Overage Pricing**:
  - Database Egress: $0.09/GB (uncached), $0.03/GB (cached)
  - Storage Egress: $0.09/GB after 250 GB
- **Spending Cap**: Enabled by default (no surprise charges)
- **Typical Cost**: $35-75/month for small-medium apps
- **Best For**: Production applications

### 2.2 Egress Breakdown

**All Services Contribute to Egress**:
- Database queries
- Auth operations
- Storage downloads
- Edge Functions
- Realtime subscriptions
- Log drains

**Optimization Strategy**:
- Use cached egress (67% cheaper: $0.03/GB vs $0.09/GB)
- Implement CDN caching
- Minimize realtime subscription payloads
- Compress data where possible

---

## 3. Usage Scenarios & Cost Calculations

### Scenario 1: Direct API (No Caching)

**Assumptions**:
- 1,000 page views/day
- Data refreshes every 30 seconds while viewing
- Average 5 minutes per session
- 10 refreshes per session (5 min ÷ 30 sec)

**Monthly API Calls**:
```
Page views/day: 1,000
Refreshes/session: 10
API calls/day: 1,000 × 10 = 10,000
API calls/month: 10,000 × 30 = 300,000
```

**Cost Analysis by Provider**:

| Provider | Plan | Monthly Cost | Notes |
|----------|------|--------------|-------|
| **AviationStack** | Professional | $149.99 | Need 3× Basic plan |
| **FlightRadar24** | Mid-tier | ~$300 | Estimated based on credits |
| **FlightAware** | Advanced | $1,000 | 100K calls plan, need 3× |
| **OpenSky** | Not viable | N/A | Max 240K calls/month (8K/day), requires commercial license |
| **Datalastic (Marine)** | Pro+ | €679 (~$740) | Unlimited calls |

**Total Monthly Cost**: $149.99 - $1,000 (flight) + $740 (marine) = **$890 - $1,740**

**Problems**:
- High API costs
- Redundant calls for same data
- Poor scalability
- No offline capability

---

### Scenario 2: Supabase Caching (Recommended)

**Architecture**:
- Backend service updates Supabase every 30 seconds
- All users read from Supabase
- No direct user-to-API calls

**Backend API Calls**:
```
Updates/hour: 120 (60 min ÷ 30 sec)
Updates/day: 120 × 24 = 2,880
Updates/month: 2,880 × 30 = 86,400
```

**Supabase Database Queries** (Frontend):
```
Page views/day: 1,000
Refreshes/session: 10
Queries/day: 10,000
Queries/month: 300,000
```

**Supabase Egress Calculation**:

Assume each query returns 50 KB of vehicle data:
```
Data/query: 50 KB
Data/day: 10,000 × 50 KB = 500 MB
Data/month: 500 MB × 30 = 15 GB
```

**Cost Analysis**:

| Component | Provider | Plan | Monthly Cost |
|-----------|----------|------|--------------|
| **Flight Tracking** | AviationStack | Professional | $149.99 |
| **Maritime Tracking** | Datalastic | Starter | €199 (~$217) |
| **Database + Hosting** | Supabase | Pro | $25 |
| **Database Egress** | Supabase | Included | $0 (under 50 GB) |
| **Storage Egress** | Supabase | Included | $0 (under 250 GB) |
| **TOTAL** | | | **$391.99** |

**Savings vs Direct API**: $890 - $391.99 = **$498.01/month (56% reduction)**

**Benefits**:
- Massive cost reduction
- Single source of truth
- Offline capability via cache
- Real-time updates via Supabase subscriptions
- Better performance (local reads)
- Scalable to more users without API cost increase

---

### Scenario 3: High Traffic (10,000 page views/day)

**Assumptions**:
- 10,000 page views/day (10× baseline)
- Same session duration and refresh rate

**Backend API Calls** (unchanged):
```
Updates/month: 86,400 (same as Scenario 2)
```

**Supabase Database Queries**:
```
Queries/day: 100,000
Queries/month: 3,000,000
```

**Supabase Egress**:
```
Data/day: 100,000 × 50 KB = 5 GB
Data/month: 5 GB × 30 = 150 GB
```

**Cost Analysis**:

| Component | Provider | Plan | Monthly Cost |
|-----------|----------|------|--------------|
| **Flight Tracking** | AviationStack | Professional | $149.99 |
| **Maritime Tracking** | Datalastic | Starter | €199 (~$217) |
| **Database + Hosting** | Supabase | Pro | $25 |
| **Database Egress** | Supabase | Overage | $9.00 ((150-50) × $0.09) |
| **TOTAL** | | | **$400.99** |

**Comparison to Direct API**:

Direct API cost would be:
```
API calls/month: 3,000,000
AviationStack Enterprise: $499.99 × 12 = ~$6,000
Datalastic Pro+: €679 (~$740)
TOTAL: ~$6,740/month
```

**Savings**: $6,740 - $400.99 = **$6,339.01/month (94% reduction)**

---

## 4. Break-Even Analysis

### When Does Caching Become Cheaper?

**Fixed Costs**:
- Supabase Pro: $25/month
- Backend API calls (30-sec updates): 86,400/month

**Variable Costs**:
- Direct API: Scales with page views
- Cached API: Minimal scaling (only egress)

**Break-Even Point Calculation**:

For **AviationStack**:
```
Direct API (Basic Plan): $49.99 for 10,000 calls
Cached approach: $149.99 (API) + $25 (Supabase) = $174.99

Break-even:
- Direct API viable: < 300 page views/day (< 3,000 API calls/month)
- Caching viable: > 300 page views/day
```

**Recommendation**: Use caching from day one if expecting:
- >100 daily active users
- >500 page views/day
- Any production traffic

The upfront $25 Supabase cost pays for itself quickly due to:
- API call reduction
- Improved performance
- Realtime capabilities
- Future scalability

---

## 5. Cost Optimization Strategies

### 5.1 API Cost Reduction

1. **Use OpenSky for Non-Commercial MVP**
   - Free: 4,000 calls/day
   - Covers 86,400 monthly backend updates
   - Switch to commercial API when ready to monetize

2. **Hybrid Approach**
   - OpenSky for general flight tracking
   - FlightAware for premium features (specific aircraft details)
   - Pay only for premium queries

3. **Update Frequency Optimization**
   - Reduce to 60-second updates: Cut API calls by 50%
   - Dynamic updates: Faster when users active, slower when idle
   - Weekend/off-peak reduction

4. **Regional Filtering**
   - Only track specific geographic regions
   - Reduces data payload and API costs
   - Most APIs charge by data volume

### 5.2 Supabase Cost Reduction

1. **Egress Optimization**
   - Enable CDN caching (reduce to $0.03/GB)
   - Implement GraphQL to reduce over-fetching
   - Use pagination instead of loading all data
   - Compress JSON responses (gzip)

2. **Storage Optimization**
   - Archive old tracking data (>30 days)
   - Store only essential fields in hot storage
   - Use database functions to aggregate data server-side

3. **Realtime Subscription Optimization**
   - Filter subscriptions to specific vehicles/regions
   - Use presence channels for active viewers only
   - Batch updates instead of per-vehicle pushes

4. **Database Query Optimization**
   - Add indexes for common queries
   - Use connection pooling
   - Implement query result caching

### 5.3 Alternative Architecture: Hybrid Caching

**Edge Caching Layer**:
```
Users → Cloudflare/Vercel Edge Cache → Supabase → APIs
```

**Benefits**:
- Reduce Supabase egress by 90%
- Serve static data from edge
- Only pay for cache misses

**Costs**:
- Cloudflare Workers: $5/month (10M requests)
- Vercel Edge Functions: Included in Pro plan

**Total Savings**: $50-100/month at high traffic

---

## 6. Recommended Tiers & Providers

### 6.1 MVP Stage (Testing/Non-Commercial)

**Flight Tracking**:
- **Primary**: OpenSky Network (Free - 4,000 calls/day)
- **Backup**: AviationStack Free (100 calls/month for testing)

**Maritime Tracking**:
- **Primary**: AISHub (Free if you contribute data)
- **Alternative**: Datalastic Trial (€9 for 14 days)

**Infrastructure**:
- **Database**: Supabase Free Tier
- **Hosting**: Vercel Free Tier

**Total Cost**: **$0-9/month**

**Limitations**:
- Non-commercial use only (OpenSky)
- Rate limits (4,000 calls/day)
- Auto-pause after inactivity (Supabase)

---

### 6.2 Production Stage (Low Traffic: <1,000 views/day)

**Flight Tracking**:
- **Recommended**: AviationStack Professional ($149.99/month)
  - 100,000 calls/month
  - Commercial license
  - Simple pricing

**Maritime Tracking**:
- **Recommended**: Datalastic Starter (€199/month)
  - 20,000 requests/month
  - Covers backend updates + some frontend queries
  - Transparent pricing

**Infrastructure**:
- **Database**: Supabase Pro ($25/month)
  - No auto-pause
  - 50 GB database egress
  - 250 GB storage egress

**Total Cost**: **$391.99/month**

**Capacity**:
- Supports 1,000 page views/day
- 10 refreshes per session
- Room for growth

---

### 6.3 Production Stage (High Traffic: 10,000 views/day)

**Flight Tracking**:
- **Recommended**: AviationStack Professional ($149.99/month)
  - Backend-only calls stay under 100K
  - No change needed

**Maritime Tracking**:
- **Recommended**: Datalastic Pro+ (€679/month)
  - Unlimited API calls
  - No overage concerns

**Infrastructure**:
- **Database**: Supabase Pro ($25 + overages)
  - Estimated overage: $9/month (100 GB egress)

**Total Cost**: **$900/month**

**Capacity**:
- Supports 10,000 page views/day
- Infinite users (cached data)
- Scalable to 100K+ views with edge caching

---

### 6.4 Enterprise Stage (100,000+ views/day)

**Flight Tracking**:
- **Recommended**: FlightAware Enterprise (Custom pricing)
  - Negotiate bulk rates
  - Dedicated support
  - SLA guarantees

**Maritime Tracking**:
- **Recommended**: MarineTraffic or Datalastic Pro+ (Custom)
  - Volume discounts
  - Custom data feeds
  - Satellite + terrestrial data

**Infrastructure**:
- **Database**: Supabase Team ($599/month) or Enterprise
  - Dedicated resources
  - Priority support
  - Custom SLA
- **CDN**: Cloudflare Enterprise or AWS CloudFront
  - Reduce egress by 95%

**Estimated Cost**: **$2,000-5,000/month**

**Capacity**:
- 100,000+ page views/day
- Global edge caching
- 99.99% uptime SLA

---

## 7. Total Monthly Estimates

### 7.1 MVP (Non-Commercial)

| Component | Provider | Cost |
|-----------|----------|------|
| Flight API | OpenSky | $0 |
| Maritime API | AISHub | $0 |
| Database | Supabase Free | $0 |
| Hosting | Vercel Free | $0 |
| **TOTAL** | | **$0/month** |

**Best For**: Proof of concept, student projects, research

---

### 7.2 Production MVP (1,000 views/day)

| Component | Provider | Cost |
|-----------|----------|------|
| Flight API | AviationStack Pro | $149.99 |
| Maritime API | Datalastic Starter | $217.00 |
| Database | Supabase Pro | $25.00 |
| **TOTAL** | | **$391.99/month** |

**Best For**: Early-stage startup, initial launch, <1K DAU

---

### 7.3 Scaled Production (10,000 views/day)

| Component | Provider | Cost |
|-----------|----------|------|
| Flight API | AviationStack Pro | $149.99 |
| Maritime API | Datalastic Pro+ | $740.00 |
| Database | Supabase Pro | $25.00 |
| Egress Overages | Supabase | $9.00 |
| **TOTAL** | | **$923.99/month** |

**Best For**: Growing app, 5-10K DAU, monetization started

---

### 7.4 Enterprise Production (100,000 views/day)

| Component | Provider | Cost |
|-----------|----------|------|
| Flight API | FlightAware Enterprise | $2,000 |
| Maritime API | MarineTraffic Enterprise | $1,500 |
| Database | Supabase Team | $599 |
| CDN | Cloudflare Pro | $200 |
| Monitoring | Datadog/NewRelic | $200 |
| **TOTAL** | | **$4,499/month** |

**Best For**: Established app, 50K+ DAU, revenue generating

---

## 8. Key Recommendations

### 8.1 Start Small, Scale Smart

**Phase 1: MVP (Months 0-3)**
- Use OpenSky + AISHub (free)
- Supabase Free Tier
- Validate product-market fit
- **Cost**: $0/month

**Phase 2: Early Production (Months 3-12)**
- Switch to AviationStack + Datalastic
- Supabase Pro
- Acquire first paying customers
- **Cost**: $392/month

**Phase 3: Scale (Months 12+)**
- Negotiate enterprise deals
- Add CDN layer
- Optimize caching
- **Cost**: $900-4,500/month

### 8.2 Critical Success Factors

1. **Implement caching from day one**
   - 56-94% cost savings
   - Better performance
   - Foundation for scale

2. **Monitor usage religiously**
   - Set up Supabase usage alerts
   - Track API call patterns
   - Identify optimization opportunities

3. **Plan for overage**
   - Keep spending cap on during testing
   - Remove cap only when revenue validated
   - Set up billing alerts

4. **Use free tiers for development**
   - OpenSky for flight data
   - AISHub for maritime
   - Never use production API keys in dev

### 8.3 Cost Per User Economics

At 10,000 views/day (assume 2,000 DAU):
```
Monthly cost: $924
Cost per DAU: $924 ÷ 2,000 = $0.46/user/month
```

**Monetization Target**: >$2/user/month to be profitable (4.3× cost)

**Achievable through**:
- Freemium: 10% convert at $5/month
- Ads: $2-5 RPM (revenue per thousand views)
- Enterprise: Custom pricing for B2B

---

## 9. Risk Factors & Mitigation

### 9.1 API Price Increases

**Risk**: Providers increase prices by 20-50%

**Mitigation**:
- Maintain relationships with 2+ providers
- Archive critical data for offline access
- Build abstraction layer to switch providers
- Lock in annual contracts when possible

### 9.2 Rate Limit Exhaustion

**Risk**: Traffic spike exceeds API limits

**Mitigation**:
- Implement request queuing
- Graceful degradation (show cached data)
- Auto-scale backend workers
- Premium tier with higher limits

### 9.3 Supabase Egress Overages

**Risk**: Viral growth causes $1,000+ egress bill

**Mitigation**:
- Enable spending cap until revenue validated
- Implement edge caching immediately
- Use GraphQL to reduce payload size
- Archive old data to reduce database size

### 9.4 Data Quality Issues

**Risk**: Free/cheap APIs have stale or incorrect data

**Mitigation**:
- Validate data freshness timestamps
- Cross-reference multiple sources
- Display "last updated" to users
- Fall back to premium API for critical queries

---

## 10. Alternative Approaches

### 10.1 Build Your Own Receiver Network

**Concept**: Deploy ADS-B/AIS receivers, contribute to OpenSky/AISHub

**Costs**:
- ADS-B receiver (RTL-SDR): $30-100 one-time
- AIS receiver: $100-300 one-time
- Raspberry Pi: $50-100
- Internet: Existing connection

**Benefits**:
- Free API access (OpenSky: 8,000 calls/day)
- Support open-source community
- Learn RF technology

**Drawbacks**:
- Limited coverage (only your region)
- Maintenance required
- Still need commercial API for global coverage

**Verdict**: Worth it for enthusiasts, not core business strategy

### 10.2 Aggregate Free APIs

**Concept**: Combine multiple free tiers (OpenSky, AISHub, etc.)

**Benefits**:
- $0 cost
- Redundancy

**Drawbacks**:
- Non-commercial use only
- Rate limits still apply
- Complex orchestration logic
- Violates most ToS for commercial use

**Verdict**: Only for non-commercial/research projects

### 10.3 Websocket Streaming APIs

**Concept**: Use streaming instead of REST polling

**Providers**:
- FlightAware Firehose (enterprise)
- AIS Stream (various providers)

**Benefits**:
- Real-time updates (no 30-sec delay)
- Potentially lower cost (single connection vs polling)
- Lower latency

**Drawbacks**:
- Complex to implement
- Need persistent connection infrastructure
- Often enterprise-only

**Verdict**: Consider for scale phase (>10K DAU)

---

## 11. Conclusion

### Recommended Implementation Path

**For Most Projects**:
1. **Start with**: OpenSky (flight) + AISHub (maritime) + Supabase Free
2. **Launch with**: AviationStack Pro + Datalastic Starter + Supabase Pro (**$392/month**)
3. **Scale to**: Enterprise APIs + Supabase Team + CDN (**$4,500/month**)

### Key Takeaways

1. **Caching is essential**: Reduces costs by 56-94%
2. **Start free, scale paid**: Validate before spending
3. **Budget $400-900/month** for production launch
4. **Plan for $0.46/user** at scale (target >$2 revenue/user)
5. **Monitor usage obsessively**: Optimize before scaling

### Next Steps

1. Set up development environment with free tiers
2. Implement Supabase caching architecture
3. Test with OpenSky + AISHub
4. Validate product-market fit
5. Upgrade to paid APIs when ready to launch
6. Monitor costs weekly
7. Optimize based on actual usage patterns

---

## Sources

**Flight Tracking APIs**:
- [FlightAware AeroAPI](https://www.flightaware.com/commercial/aeroapi/)
- [FlightRadar24 API Subscriptions](https://fr24api.flightradar24.com/subscriptions-and-credits)
- [AviationStack Pricing](https://aviationstack.com/pricing)
- [OpenSky Network API Documentation](https://openskynetwork.github.io/opensky-api/rest.html)
- [The Power of Affordable Flight API for Businesses](https://aerodatabox.com/flight-api-2024/)
- [5 Best Flight Status APIs in 2026](https://www.flightapi.io/blog/flight-status-apis/)

**Maritime Tracking APIs**:
- [Datalastic Pricing](https://datalastic.com/pricing/)
- [MarineTraffic Data Services](https://www.kpler.com/product/maritime/data-services)
- [AISHub Free AIS Data](https://www.aishub.net/)
- [VesselFinder API Documentation](https://api.vesselfinder.com/docs/)
- [Marine Traffic Data: Best Datasets & Databases 2026](https://datarade.ai/data-categories/marine-traffic-data)

**Supabase Pricing**:
- [Supabase Pricing & Fees](https://supabase.com/pricing)
- [Supabase Pricing 2026 Complete Breakdown](https://www.metacto.com/blogs/the-true-cost-of-supabase-a-comprehensive-guide-to-pricing-integration-and-maintenance)
- [Manage Egress Usage - Supabase Docs](https://supabase.com/docs/guides/platform/manage-your-usage/egress)
- [Supabase Billing Documentation](https://supabase.com/docs/guides/platform/billing-on-supabase)
- [Storage: Cheaper Egress Pricing](https://supabase.com/blog/storage-500gb-uploads-cheaper-egress-pricing)
