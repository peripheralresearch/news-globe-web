# Military Vehicle Tracking - Cost Summary

## Quick Reference: Monthly Costs by Stage

```
┌─────────────────────────────────────────────────────────────────┐
│                    COST PROGRESSION                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  MVP (Testing)              Production MVP           Scaled     │
│  ┌──────────┐              ┌──────────┐           ┌──────────┐ │
│  │   $0     │    →         │  $392    │    →      │  $924    │ │
│  └──────────┘              └──────────┘           └──────────┘ │
│  0-1K views/day            1K views/day           10K views/day │
│                                                                 │
│  • OpenSky (free)          • AviationStack Pro    • Same APIs  │
│  • AISHub (free)           • Datalastic Starter   • Datalastic │
│  • Supabase Free           • Supabase Pro           Pro+       │
│                                                   • More egress │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Caching Impact: Direct API vs Supabase Caching

### Scenario: 1,000 page views/day, 10 refreshes per session

```
┌──────────────────────────────────────────────────────────────────┐
│                    COST COMPARISON                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Direct API (No Caching)         Supabase Caching (Recommended) │
│  ┌────────────────────┐          ┌────────────────────┐         │
│  │    $890-$1,740     │          │       $392         │         │
│  └────────────────────┘          └────────────────────┘         │
│                                                                  │
│  • 300K API calls/mo             • 86.4K API calls/mo           │
│  • Scales with users             • Fixed API cost               │
│  • Redundant requests            • Cached data                  │
│  • Poor performance              • Real-time updates            │
│                                                                  │
│                    SAVINGS: $498-$1,348/mo (56-78%)             │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### High Traffic: 10,000 page views/day

```
┌──────────────────────────────────────────────────────────────────┐
│              HIGH TRAFFIC COST COMPARISON                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Direct API                      Supabase Caching               │
│  ┌────────────────────┐          ┌────────────────────┐         │
│  │     ~$6,740        │          │       $924         │         │
│  └────────────────────┘          └────────────────────┘         │
│                                                                  │
│  • 3M API calls/mo               • 86.4K API calls/mo           │
│  • Enterprise tier needed        • Same API tier                │
│  • Massive egress costs          • Minimal overages             │
│                                                                  │
│                    SAVINGS: $5,816/mo (86% reduction)           │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## API Call Calculations

### Backend Update Strategy (30-second intervals)

```
Updates per hour:   120 (60 min ÷ 30 sec)
Updates per day:    2,880
Updates per month:  86,400

This is CONSTANT regardless of user count!
```

### Frontend Query Load

```
Per 1,000 views/day:
  Queries/day:   10,000 (1,000 views × 10 refreshes)
  Queries/month: 300,000

Per 10,000 views/day:
  Queries/day:   100,000
  Queries/month: 3,000,000

Queries are served from Supabase cache (not API)
```

## Break-Even Analysis

### When Does Caching Pay Off?

```
Fixed Costs (Caching Approach):
  ├─ Supabase Pro: $25/month
  ├─ Backend API calls: ~$150-220/month
  └─ TOTAL FIXED: $175-245/month

Variable Costs:
  ├─ Direct API: Scales linearly with page views
  └─ Caching: Minimal (only Supabase egress)

Break-even point: ~300-500 page views/day

Below 300 views/day:   Direct API might be cheaper
Above 500 views/day:   Caching is ALWAYS cheaper
Above 2,000 views/day: Caching is DRAMATICALLY cheaper (10-50× savings)
```

## Cost Per User Economics

### At 10,000 page views/day (assume 2,000 DAU)

```
Monthly Infrastructure Cost: $924
Cost per User per Month:     $0.46

Target Revenue per User:     >$2.00 (4-5× cost)

Achievable through:
  • Freemium: 10% convert at $5/month → $1.00 avg → BREAK EVEN
  • Freemium: 20% convert at $5/month → $2.00 avg → 2× PROFIT
  • Ads: $3-5 RPM → $1.50-2.50 avg → 2-3× PROFIT
  • Premium: $10/month tier → Higher margins
```

## Recommended Provider Comparison

### Flight Tracking APIs

| Provider | Best For | Free Tier | Paid Plans | Notes |
|----------|----------|-----------|------------|-------|
| **OpenSky** | MVP/Testing | 4K calls/day | N/A (non-commercial) | Free but no commercial use |
| **AviationStack** | Production | 100 calls/mo | $50-500/mo | Simple, transparent pricing |
| **FlightRadar24** | Budget | None | $9-900/mo | Credit-based, good value |
| **FlightAware** | Enterprise | $5 credit | $100-1000+/mo | Complex pricing, best data |

### Maritime Tracking APIs

| Provider | Best For | Free Tier | Paid Plans | Notes |
|----------|----------|-----------|------------|-------|
| **AISHub** | MVP/Testing | Unlimited* | None | *Must contribute data |
| **Datalastic** | Production | 14-day trial | €199-679/mo | Transparent, self-service |
| **VesselFinder** | Pay-as-go | None | Credit-based | No free tier |
| **MarineTraffic** | Enterprise | None | Custom quotes | Best coverage, expensive |

## Optimization Opportunities

### API Cost Reduction (Potential 40-60% savings)

```
1. Update Frequency
   Current:  30-second updates → 2,880/day
   Optimized: 60-second updates → 1,440/day
   Savings: 50% API cost reduction

2. Regional Filtering
   Current:  Global tracking → Full dataset
   Optimized: Specific regions → 30-50% smaller payload
   Savings: 30-50% data cost reduction

3. Off-Peak Reduction
   Current:  24/7 updates
   Optimized: Slower updates during low traffic (2-5am)
   Savings: 10-20% API cost reduction

Total Potential Savings: $150-250/month
```

### Supabase Cost Reduction (Potential 50-70% savings)

```
1. CDN Caching
   Current:  $0.09/GB egress
   With CDN: $0.03/GB egress (cached)
   Savings: 67% egress cost reduction

2. GraphQL Implementation
   Current:  REST (over-fetching)
   With GQL: Only requested fields
   Savings: 30-50% bandwidth reduction

3. Data Compression
   Current:  Raw JSON
   With gzip: 60-80% smaller payloads
   Savings: 60-80% egress reduction

Total Potential Savings: $50-100/month at scale
```

## Risk Mitigation Budget

### Add 20% buffer for contingencies

```
Base Production Cost:     $392/month
Risk Buffer (20%):        $78/month
Total Budget:             $470/month

Covers:
  • API price increases
  • Traffic spikes
  • Feature experimentation
  • Testing/staging environments
```

## Final Recommendations

### Implementation Timeline & Costs

```
Month 0-3 (MVP):
  └─ Cost: $0/month (free tiers)
  └─ Goal: Validate product-market fit
  └─ Users: <100 DAU

Month 3-6 (Launch):
  └─ Cost: $392/month (production APIs)
  └─ Goal: Acquire first 1,000 users
  └─ Users: 100-500 DAU

Month 6-12 (Growth):
  └─ Cost: $400-700/month (scaling)
  └─ Goal: Reach 5,000 users
  └─ Users: 1,000-2,500 DAU

Month 12+ (Scale):
  └─ Cost: $900-4,500/month (enterprise)
  └─ Goal: 50,000+ users
  └─ Users: 10,000+ DAU
```

### Critical Success Factors

1. **Implement caching from day one** (56-94% savings)
2. **Use free tiers for MVP** (validate before spending)
3. **Monitor usage weekly** (catch issues early)
4. **Optimize before scaling** (cheaper to optimize at small scale)
5. **Plan for 4-5× revenue/cost ratio** (sustainable unit economics)

---

## Quick Decision Matrix

```
If your project is...

┌─────────────────────────────────────────────────────────────┐
│ Non-commercial / Research                                   │
├─────────────────────────────────────────────────────────────┤
│ Use: OpenSky + AISHub + Supabase Free                       │
│ Cost: $0/month                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Early Startup / MVP (<1K views/day)                         │
├─────────────────────────────────────────────────────────────┤
│ Use: AviationStack Pro + Datalastic Starter + Supabase Pro │
│ Cost: $392/month                                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Growing Product (1K-10K views/day)                          │
├─────────────────────────────────────────────────────────────┤
│ Use: Same APIs + Datalastic Pro+ + Optimizations           │
│ Cost: $700-924/month                                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Enterprise (>10K views/day)                                 │
├─────────────────────────────────────────────────────────────┤
│ Use: FlightAware Enterprise + MarineTraffic + CDN          │
│ Cost: $2,000-5,000/month                                    │
└─────────────────────────────────────────────────────────────┘
```

---

**Bottom Line**: Budget $400-900/month for production launch with caching. This provides 4-5× room for growth before needing to scale infrastructure.
