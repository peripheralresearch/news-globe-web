# Maritime and Naval Vessel Tracking APIs Research

**Date:** January 16, 2026
**Purpose:** Comprehensive research on available APIs for tracking maritime vessels, with focus on military/naval vessel capabilities and limitations.

---

## Executive Summary

**Key Finding:** Military and naval vessels are **explicitly exempt** from SOLAS AIS carriage requirements under international law. Warships, naval auxiliaries, and government-owned vessels are not required to broadcast AIS, making commercial AIS-based tracking of military vessels extremely limited and unreliable.

**Coverage Limitations:**
- Most commercial AIS APIs track civilian vessels only
- Military vessels can disable AIS transponders for operational security
- Alternative OSINT methods (satellite imagery, radar detection) exist but require different approaches
- AIS spoofing and manipulation is common for vessels engaged in sensitive operations

---

## Major Maritime Tracking APIs

### 1. MarineTraffic

**Website:** https://www.marinetraffic.com/
**API Documentation:** https://servicedocs.marinetraffic.com/

#### Military/Naval Vessel Coverage
- **Limited to no coverage** - Military vessels can disable AIS for security reasons
- IMO requires ships over 300 gross tonnage to install AIS, but military vessels are **exempt**
- May show military vessels only when they voluntarily broadcast AIS (rare)

#### Data Coverage
- **Sources:** Terrestrial and satellite AIS
- **Coverage:** Global, with strongest coverage near coasts
- **Vessel Count:** Tracks vessels broadcasting AIS worldwide
- **Historical Data:** Available, enabling analysis of maritime operations

#### API Features
- Real-time AIS data with live updates on port calls, bunkering, ship-to-ship transfers
- Historical vessel movements and event data
- Predictive analytics using ML for destination predictions and ETA forecasts
- Multiple response types: simple, extended, full (affects pricing)

#### Pricing & Rate Limits
- **Pricing Model:** Custom enterprise pricing (not publicly listed)
- **Factors:** Number of vessels tracked, API request frequency, data source (terrestrial/satellite)
- **Volume Discounts:** Available for tracking 25+ vessels
- **Satellite AIS:** Additional costs per vessel or fleet
- **Rate Limits:** Varies by subscription plan (specific numbers not disclosed)
- **Contact:** Must contact MarineTraffic for detailed 2026 pricing

#### Authentication
- API key required (environment variable: `MARINETRAFFIC_API_KEY`)
- Automatic retry with exponential backoff for rate limiting

#### Data Fields
- Standard AIS fields including MMSI, position, speed, heading, vessel type
- Extended voyage data (destination, ETA, port calls)
- Vessel particulars and historical tracks

#### Update Frequency
- **Real-time data:** Near-instantaneous for terrestrial AIS
- **Satellite AIS:** Variable, typically minutes to hours between updates

---

### 2. VesselFinder

**Website:** https://www.vesselfinder.com/
**API Documentation:** https://api.vesselfinder.com/docs/

#### Military/Naval Vessel Coverage
- **No dedicated military vessel tracking**
- Shows only vessels broadcasting AIS
- Same SOLAS exemption limitations apply

#### Data Coverage
- **Terrestrial AIS:** Premium subscription
- **Satellite AIS:** Separate subscription for global open-sea tracking
- **Historical Data:** Available from 2009 onwards in XLS/CSV format
- **Coverage:** 10+ vessels average required for API access (for contributors)

#### API Features
- Vessel Positions API - real-time AIS tracking
- Port Calls API
- Master Data API (vessel particulars)
- Distance/Route Planner API
- Fleet tracking capabilities
- Custom area filtering (geographic bounding boxes)

#### Pricing & Rate Limits
- **Credit-Based System:**
  - 1 credit per terrestrial AIS position
  - 10 credits per satellite AIS position
  - Credits valid for 12 months
  - Pay-as-you-go model
- **All APIs share the same credit pool**
- Processes millions of raw NMEA messages daily

#### Authentication
- API key required for all endpoints
- JSON format by default

#### Technical Implementation
- **Protocol:** REST API (HTTP/HTTPS)
- **Data Formats:** JSON, XML, NMEA
- **No WebSocket support** (uses HTTP polling)
- Real-time data via TCP/IP or UDP stream (raw NMEA)

#### Data Fields
- MMSI, IMO, vessel name, callsign
- Latitude, longitude (decimal degrees)
- Speed over ground, course over ground, heading
- Vessel type, flag, dimensions (A, B, C, D)
- Draught, destination, ETA
- Navigation status
- Timestamp, data source (terrestrial/satellite)

#### Update Frequency
- **Terrestrial:** Near-real-time (seconds to minutes)
- **Satellite:** Variable (minutes to hours)
- Depends on vessel speed and location

---

### 3. Spire Maritime

**Website:** https://spire.com/maritime/
**API Documentation:** https://maritime.spire.com/

#### Military/Naval Vessel Coverage
- **No military-specific tracking**
- Largest proprietary satellite constellation (100+ nanosatellites)
- Can only track military vessels if they broadcast AIS
- Spire's solutions are "suitable for military applications" but limited to AIS data

#### Data Coverage
- **Vessel Count:** Tracks 600K+ vessels, 250K active daily
- **Coverage:** 24/7 near-global coverage
- **Constellation:** Proprietary satellite network
- **Historical Data:** Available with custom file delivery
- **Refresh Rates:**
  - Near shore: 1 minute average (industry-leading)
  - Open ocean: 6 minutes average
  - 90% of positions have <1 hour latency (gold standard)

#### API Features
- Standard AIS and Enhanced Satellite AIS
- Combines terrestrial + satellite data
- GraphQL API (Maritime 2.0)
- Live feeds (TCP raw NMEA)
- Custom data packages available
- Real-time and historical data access

#### Pricing & Rate Limits
- **Custom pricing only** (not publicly listed)
- Tailored to unique business needs
- Must complete inquiry form for 2026 quotes
- Enterprise-focused pricing model

#### Authentication
- API key or token-based authentication
- Details provided upon subscription

#### Technical Implementation
- **Protocol:** REST API, GraphQL, TCP live feeds
- **Data Formats:** JSON, NMEA
- **Latency:** <1 minute (best in industry)

#### Data Fields
- Complete AIS data set (static, dynamic, voyage)
- Vessel identity (MMSI, IMO, name, callsign, type, flag)
- Position (lat/lon, accuracy)
- Motion (speed, course, heading)
- Dimensions, draught, destination, ETA
- Navigation status, data source, timestamp

#### Update Frequency
- **Best-in-class:** Sub-1-minute latency
- **Open ocean:** 6-minute average
- Most sources refresh every 20 minutes (Spire's 60-second rate is gold standard)

---

### 4. ORBCOMM (now S&P Global)

**Website:** https://www.orbcomm.com/en/solutions/maritime/ais-data
**Note:** S&P Global acquired ORBCOMM's AIS business in November 2025

#### Military/Naval Vessel Coverage
- **Limited to AIS-broadcasting vessels only**
- No special military vessel tracking capabilities

#### Data Coverage
- **Processing Capacity:** 30 million messages daily
- **Unique Vessels:** 240,000+
- **Sources:** Satellite AIS (own constellation) + terrestrial AIS (partner networks)
- **Coverage:** Global, with focus on open ocean satellite coverage

#### API Features
- Satellite + terrestrial AIS data integration
- Near real-time open ocean tracking
- One-stop shop for both data sources
- Historical data available

#### Pricing & Rate Limits
- **Claims:** "Most cost-effective AIS solution on market"
- **Pricing:** Custom quotes (not publicly listed)
- **Contact required** for detailed pricing
- Enterprise-focused

#### Data Fields
- Standard AIS dataset:
  - Vessel coordinates, course, speed
  - Vessel identity (name, callsign, MMSI, type)
  - AIS status
  - Destination and ETA
  - Draught

#### Update Frequency
- Near real-time for satellite data
- Variable based on satellite coverage and vessel location

---

### 5. AISHub

**Website:** https://www.aishub.net/
**API Documentation:** https://www.aishub.net/api

#### Military/Naval Vessel Coverage
- **Community-driven AIS data** - no military-specific features
- Coverage depends on community contributors

#### Data Coverage
- **Model:** Data exchange network (contribute to access)
- **Coverage:** Aggregated from community AIS feeds
- **Quality Requirements:**
  - Minimum 10 vessels average (last 7 days)
  - 90%+ uptime (last 7 days)

#### API Features
- Real-time aggregated AIS data
- Data formats: XML, JSON, CSV
- Free for contributors who share their AIS feed
- Web service API access

#### Pricing & Rate Limits
- **Free for contributors** who meet quality requirements
- Must share your own AIS feed to access aggregated data
- API access granted after approval

#### Authentication
- API key provided after feed approval
- Must maintain feed quality standards

#### Technical Implementation
- **Protocol:** HTTP REST API
- **Data Formats:** XML, JSON, CSV
- **No WebSocket support**

#### Data Fields
- Standard AIS fields
- MMSI, position, speed, course, heading
- Vessel name, type
- Timestamp

#### Update Frequency
- Real-time (depends on community feed quality)
- Variable based on geographic coverage

---

### 6. AISstream.io

**Website:** https://aisstream.io/
**Documentation:** https://github.com/aisstream/aisstream

#### Military/Naval Vessel Coverage
- **No military-specific tracking**
- Limited to AIS-broadcasting vessels

#### Data Coverage
- **Global AIS data stream**
- Free access to worldwide AIS
- No data sharing required (unlike AISHub)

#### API Features
- **WebSocket streaming** (primary feature)
- Real-time AIS data push
- MMSI filtering (subscribe to specific vessels)
- Filter by vessel type, geographic area
- Free global access

#### Pricing & Rate Limits
- **Completely FREE**
- No credit system or subscription required
- Global AIS data stream via WebSocket
- Most accessible option for developers

#### Authentication
- Basic WebSocket connection
- API key may be required (check documentation)

#### Technical Implementation
- **Protocol:** WebSocket (real-time push)
- **Data Format:** JSON
- **Filtering:** MMSI, vessel type, geographic region
- Best option for streaming real-time data

#### Data Fields
- Standard AIS message data
- Vessel identity (MMSI, IMO, name)
- Position, speed, course, heading
- Vessel type, navigation status
- Destination, ETA

#### Update Frequency
- Real-time streaming (sub-second to seconds)
- Push-based (no polling required)

---

### 7. Datalastic

**Website:** https://datalastic.com/
**API Documentation:** https://datalastic.com/api-reference/

#### Military/Naval Vessel Coverage
- **No military vessel tracking**
- Standard AIS limitations apply

#### Data Coverage
- **Vessel Count:** 600,000+ vessels
- **Update Frequency:** Minutely updates
- **Historical Data:** Available for analysis and reporting
- **Port Data:** Structured port information worldwide

#### API Features
- Ship Tracking API (live AIS positions)
- Port API (port data and codes)
- Historical Vessel Tracking
- Location Tracking API (area-based queries)
- Vessel Finder (search by name, IMO, MMSI)
- Ship Specs Info (vessel particulars)
- Route Calculator

#### Pricing & Rate Limits
- **Credit-Based System:**
  - Credits = database requests (API calls)
  - 1 vessel position = 1 credit
  - Credit consumption varies by endpoint
  - Automatic blocking when limit reached (cost protection)
- **Trial:** 14-day trial included
- **Discount:** 10% off annual subscriptions
- **Self-Service:** API key within 5 minutes
- **Money-Back:** 2-week guarantee

#### API Endpoints & Performance
1. **Basic Endpoint** (`/vessel`):
   - 0.005 sec avg response time
   - Most popular real-time tracking data
2. **Pro Endpoint** (`/vessel_pro`):
   - 0.9 sec avg response time
   - Extended data (ETA, ATD, draft, standardized destination)
3. **Bulk Endpoint** (`/vessel_bulk`):
   - Up to 100 vessels per request
   - Basic endpoint data

#### Authentication
- API key-based
- Instant setup (5 minutes)

#### Technical Implementation
- **Protocol:** REST API
- **Data Format:** JSON
- **Performance:** Very fast (5ms for basic queries)

#### Data Fields
- MMSI, IMO, vessel name, callsign
- Position (lat/lon), speed, course, heading
- Vessel type, flag, dimensions
- Build year, tonnage
- ETA, ATD, draft (Pro endpoint)
- Port of departure/arrival
- Standardized destination names

#### Update Frequency
- **Minutely updates** for 600K+ vessels
- Near real-time performance

---

### 8. MyShipTracking

**Website:** https://www.myshiptracking.com/
**API Documentation:** https://api.myshiptracking.com/

#### Military/Naval Vessel Coverage
- **No military vessel tracking**
- Terrestrial AIS only (limited coverage)

#### Data Coverage
- **Real-time terrestrial AIS data**
- **Historical tracks** and port call records
- **Coverage:** Limited to nearshore areas (terrestrial AIS limitation)
- Historical data may have incomplete routes

#### API Features
- Real-Time Vessel Tracking (position, speed, course, voyage info)
- MMSI/IMO tracking
- Bulk Vessel Retrieval (up to 100 vessels per request)
- Historical Track API
- Fleet Management (create, edit, manage fleets)
- Port Information (search by UN/LOCODE or name)
- Arrival estimates

#### Pricing & Rate Limits
- **Credit-Based System:**
  - Simple response: 1 credit per vessel
  - Extended response: 3 credits per vessel
  - Maximum charge per request: 500 credits (cost cap)
- **Trial:**
  - One trial API key per user
  - 2000 coins (credits)
  - 10-day maximum active period

#### Authentication
- API key required
- Trial key available for testing

#### Technical Implementation
- **Protocol:** REST API
- **Data Format:** JSON
- **Bulk Requests:** Comma-separated MMSI/IMO (max 100)

#### Data Fields
- MMSI, IMO numbers
- Current position, speed, course
- Voyage information
- Port details
- Historical tracks
- Fleet associations

#### Update Frequency
- Real-time for terrestrial AIS
- Limited to nearshore coverage areas

#### Important Limitations
- **Terrestrial AIS only** = nearshore coverage only
- Historical data restricted to coastal areas
- Vessel routes may be incomplete in open ocean

---

### 9. VT Explorer

**Website:** https://www.vtexplorer.com/
**API Documentation:** https://api.vtexplorer.com/docs/

#### Military/Naval Vessel Coverage
- **No military-specific tracking**
- Standard AIS limitations

#### Data Coverage
- **Terrestrial AIS stations:** Hundreds worldwide
- **Historical Data:** Available from 2009
- **Coverage:** Global terrestrial network
- **Satellite AIS:** Available (10 credits per position)

#### API Features
- Vessel Positions API
- Live Data for Predefined Areas
- Fleet Position Tracking
- Historical AIS Data (from 2009)
- Port Calls Dataset
- Master Data (vessel particulars)
- Geographic area filtering
- ECA (Emission Control Area) status

#### Pricing & Rate Limits
Two pricing models available:

**1. Credit-Based Pricing:**
- 1 credit per terrestrial AIS position
- 10 credits per satellite AIS position
- 5 credits per ship for AIS dataset
- 2 credits per record for PortCall dataset
- **Subscription basis:** Lower price, valid 1 month
- **On-demand basis:** Higher price, valid 12 months

**2. Subscription-Based Pricing:**
- Fixed monthly or annual fee
- Depends on area size, vessel traffic density, datasets
- Varies based on fleet size
- Custom pricing upon request

#### Authentication
- API key required
- Provided upon subscription

#### Technical Implementation
- **Protocol:** REST API
- **Data Formats:** JSON, XML
- **Geographic Filtering:** Bounding boxes, custom areas

#### Data Fields

**AIS Data:**
- MMSI, IMO, timestamp
- Latitude, longitude
- Course, speed, heading
- Navigation status
- Vessel name, callsign, type
- Vessel dimensions (A, B, C, D)
- Draught, destination, ETA
- Source (terrestrial/satellite)
- Zone, ECA status

**Master Data:**
- IMO, name, flag, type
- Built year, builder
- Owner, manager
- Length, beam, max draught
- Gross tonnage, net tonnage, deadweight
- TEU, crude capacity

**Voyage Data:**
- Port code, departure time
- Last port, last country

#### Update Frequency
- Real-time for terrestrial AIS
- Variable for satellite AIS
- Historical data query-based

---

## AIS Data Update Frequency & Latency

### Terrestrial AIS (T-AIS)

**Update Frequency:**
- Class A/B vessels at low speed: Every 3 minutes
- Vessels at higher speeds: More frequent (up to several seconds)
- Anchored/moored vessels: Every 3 minutes

**Latency:**
- **Extremely low latency** (near-zero)
- Terrestrial-received messages immediately available
- Best for nearshore tracking

**Limitations:**
- Coverage limited to ~40-60 nautical miles from shore
- No open ocean coverage
- Depends on receiver network density

### Satellite AIS (S-AIS)

**Update Frequency:**
- Ocean-going vessels (Class A): Average 1 position per hour
- May vary from few minutes to several hours
- Depends on satellite orbital patterns

**Latency:**
- Typical: Several minutes to hours
- Spire Maritime: <1 minute (industry best)
- Most providers: 20-minute refresh rate
- 90% of ship positions: <1 hour latency (industry average)

**Advantages:**
- Global coverage (including open ocean)
- No terrestrial infrastructure needed
- Fills gaps in terrestrial coverage

**Limitations:**
- Will never match terrestrial network's near-zero latency
- Fewer satellite overpasses in open ocean
- Higher latency than terrestrial

### Real-Time Performance Standards

- **Gold Standard:** <60 second latency (Spire Maritime)
- **Industry Average:** 20-minute refresh rate
- **Acceptable:** <1 hour for 90% of positions
- **Satellite Only:** Average 1 hour between updates

---

## Military Vessel Tracking: Legal & Technical Considerations

### SOLAS AIS Requirements

**General Requirements (Non-Military):**
- Ships 300+ gross tonnage on international voyages: AIS required
- Cargo ships 500+ gross tonnage (domestic): AIS required
- All passenger ships: AIS required (regardless of size)
- Effective date: December 31, 2004

**Military Vessel Exemption:**
- **Warships:** EXEMPT from AIS requirements
- **Naval auxiliaries:** EXEMPT
- **Government-owned/operated vessels:** EXEMPT
- Under international law (SOLAS), military vessels are explicitly not required to carry AIS

### Operational Security Considerations

**AIS Can Be Disabled:**
- Masters may switch off AIS if it compromises ship safety/security
- When security incidents are imminent
- International agreements may protect navigational information
- Military vessels routinely disable AIS for operational security

**U.S. Warship Exception:**
- U.S. warships and government vessels exempt from AIS requirements
- Equipped with alternative navigation systems meeting government regulations
- Used only in government non-commercial service

### Tracking Limitations

**Why Military Vessels Are Hard to Track:**
1. **No AIS Requirement:** Not legally required to broadcast
2. **Operational Security:** Intentionally disable transponders
3. **AIS Spoofing:** Can transmit false position data
4. **Intermittent Broadcasts:** May broadcast selectively
5. **Commercial API Gaps:** Most APIs don't differentiate military vessels

**What Can Be Tracked:**
- Military vessels that voluntarily broadcast AIS (rare)
- Naval vessels in port or non-combat operations (occasional)
- Support vessels and auxiliaries (sometimes)
- Coast guard and law enforcement vessels (more common)

**What Cannot Be Tracked:**
- Active duty warships and submarines
- Vessels on classified missions
- Special operations craft
- Vessels in operational security posture

---

## Alternative Military Vessel Tracking Methods

### 1. Synthetic Aperture Radar (SAR) Satellites

**Capabilities:**
- See through clouds and darkness
- Detect vessels regardless of AIS status
- Identify "dark ships" (AIS disabled)

**Primary OSINT Source:**
- **Sentinel-1 satellites** (European Radar Observatory, Copernicus)
- Free and open data access
- Can reveal military secrets with proper analysis

**Tools:**
- Sentinel Hub
- Google Earth Engine
- Planet Labs (commercial)

**Limitations:**
- Requires technical expertise to interpret
- Lower temporal resolution than AIS
- Image processing needed

### 2. Optical Satellite Imagery

**Sources:**
- Google Earth
- Planet Labs
- Maxar
- Sentinel-2 (European Space Agency)

**Capabilities:**
- Visual identification of vessels
- Port activity monitoring
- Ship counting and classification

**Limitations:**
- Cloud cover restrictions
- Daylight required (for optical)
- Less frequent updates than AIS

### 3. Radio Frequency (RF) Detection

**Capabilities:**
- Detect radar emissions from vessels
- Identify ships by their RF signatures
- Track vessels that disable AIS

**Applications:**
- Detecting illegal fishing (Chinese fleets near Galapagos)
- Identifying vessels with deceptive practices
- Military intelligence gathering

**Availability:**
- Commercial RF satellites emerging
- Historically military/intelligence only
- Becoming more accessible via OSINT

### 4. Multi-Intelligence (Multi-INT) Approach

**Recommended Strategy:**
- Combine AIS + SAR + Optical + RF data
- Cross-reference multiple sources
- Fill gaps when AIS is disabled

**Example Use Cases:**
- Chinese fishing fleets hiding locations
- Tankers at Iranian oil ports
- Weapons and drug smuggling vessels
- Military operations and exercises

**Tools & Platforms:**
- MarineTraffic (AIS baseline)
- Sentinel Hub (SAR imagery)
- Planet Labs (optical satellite)
- Commercial RF providers (emerging)

### 5. Geolocation Intelligence

**Mobile Device Tracking:**
- Mobile phones on board vessels emit location signals
- Can reveal port calls even with AIS disabled
- Useful for tracking "dark" vessels

**Limitations:**
- Privacy and legal concerns
- Limited availability in open ocean
- Requires specialized access

---

## Technical Implementation Considerations

### REST API vs WebSocket/Streaming

**REST APIs (Polling):**
- Most common: MarineTraffic, VesselFinder, Datalastic, Spire, VT Explorer, MyShipTracking
- Client polls server at intervals
- Simpler to implement
- Higher latency for real-time updates
- More API calls = higher costs

**WebSocket Streaming (Push):**
- Available: **AISstream.io** (free, primary WebSocket provider)
- Server pushes updates to client
- Real-time with minimal latency
- Persistent connection required
- More efficient for continuous tracking
- Lower overall costs for high-frequency updates

**TCP/UDP Streams (Raw NMEA):**
- Available: Spire Maritime, VesselFinder
- Raw AIS messages (NMEA format)
- Requires parsing and decoding
- Lowest latency
- Most complex implementation

**Recommendation:**
- **For real-time streaming:** Use AISstream.io (free WebSocket)
- **For REST polling:** Datalastic (fast, affordable) or VesselFinder (comprehensive)
- **For enterprise needs:** Spire Maritime or MarineTraffic

### Geographic Filtering

**Common Approaches:**
1. **Bounding Box:** Min/max latitude and longitude
2. **Radius:** Center point + distance
3. **Polygon:** Custom geographic area
4. **Port/Region:** Named locations (ports, EEZ, etc.)

**APIs with Geographic Filtering:**
- Datalastic: Area-based queries
- VesselFinder: Custom area API
- VT Explorer: Predefined area tracking
- AISstream.io: Geographic subscription filters

### Historical Track Data

**Providers with Historical Data:**
- VT Explorer: From 2009 (extensive historical archive)
- VesselFinder: From 2009 (XLS/CSV format)
- MarineTraffic: Historical movements and events
- MyShipTracking: Historical tracks and port calls
- Spire Maritime: Custom historical file delivery
- Datalastic: Historical movement data

**Use Cases:**
- Vessel route analysis
- Port call history
- Traffic pattern studies
- Accident investigations
- Compliance verification

**Formats:**
- XLS/CSV files (batch download)
- JSON/XML API responses
- Database dumps (enterprise)

---

## Standard AIS Data Fields

### Dynamic Data (Position Reports)

| Field | Description | Type | Special Values |
|-------|-------------|------|----------------|
| **MMSI** | Maritime Mobile Service Identity | Integer (9 digits) | Unique vessel identifier |
| **Timestamp** | Message timestamp | ISO 8601 / Unix | UTC time |
| **Latitude** | Vessel position latitude | Decimal degrees | -90 to +90 |
| **Longitude** | Vessel position longitude | Decimal degrees | -180 to +180 |
| **Speed** | Speed over ground | Knots (0.1 resolution) | 102.3 = not available |
| **Course** | Course over ground | Degrees (0-360) | 360 = not available |
| **Heading** | True heading | Degrees (0-360) | 511 = not available |
| **Navigation Status** | Vessel status | Enum | Underway, anchored, moored, etc. |
| **Position Accuracy** | GPS accuracy | Boolean | High/Low accuracy |
| **Rate of Turn** | Turn rate | Degrees/minute | 128 = not available |

### Static Data (Vessel Information)

| Field | Description | Type | Notes |
|-------|-------------|------|-------|
| **IMO** | International Maritime Organization number | Integer (7 digits) | Permanent vessel ID |
| **Vessel Name** | Ship name | String | Up to 20 characters |
| **Callsign** | Radio callsign | String | Up to 7 characters |
| **Vessel Type** | Ship type code | Integer (0-99) | Cargo, tanker, fishing, etc. |
| **Flag** | Country of registration | ISO 3166-1 alpha-2 | Derived from MMSI |
| **Dimensions** | Vessel size | A, B, C, D (meters) | Distance to GPS from bow/stern/port/starboard |
| **Length** | Overall length | Meters | Calculated from A+B |
| **Beam** | Vessel width | Meters | Calculated from C+D |

### Voyage-Related Data

| Field | Description | Type | Notes |
|-------|-------------|------|-------|
| **Draft / Draught** | Maximum depth below waterline | Meters (0.1 resolution) | Current draft, not max |
| **Destination** | Destination port | String | Up to 20 characters, unstructured |
| **ETA** | Estimated Time of Arrival | MMDDHHMM | Month-Day-Hour-Minute format |
| **ATD** | Actual Time of Departure | ISO 8601 timestamp | Not in all APIs |
| **Port of Departure** | Origin port | String / Code | May include UN/LOCODE |
| **Port of Arrival** | Destination port | String / Code | May include UN/LOCODE |

### Extended Data (API-Specific)

Some APIs provide additional enriched data:
- **Owner / Manager:** Vessel ownership information
- **Built Year / Builder:** Construction details
- **Gross Tonnage / Net Tonnage:** Vessel capacity
- **Deadweight Tonnage:** Cargo capacity
- **TEU:** Container capacity (container ships)
- **Crude Capacity:** Tank capacity (tankers)
- **ECA Status:** Emission Control Area compliance
- **Zone:** Geographic zone (coastal, EEZ, etc.)
- **Data Source:** Terrestrial vs. Satellite AIS

---

## Recommendations by Use Case

### Civilian Maritime Tracking (General)
**Recommended:** Datalastic or VesselFinder
- **Why:** Affordable, fast, comprehensive data
- **Cost:** Credit-based, transparent pricing
- **Coverage:** Good global coverage (terrestrial + satellite)
- **Ease:** Self-service, quick setup

### Real-Time Streaming Applications
**Recommended:** AISstream.io
- **Why:** Free WebSocket streaming, global data
- **Cost:** FREE
- **Protocol:** WebSocket (push-based)
- **Filtering:** MMSI, vessel type, geographic area

### Enterprise / Mission-Critical
**Recommended:** Spire Maritime or MarineTraffic
- **Why:** Best-in-class latency, reliability, coverage
- **Cost:** Enterprise pricing (higher, but worth it)
- **Coverage:** Largest constellations, 24/7 global coverage
- **Support:** Dedicated support, SLAs

### Historical Analysis / Research
**Recommended:** VT Explorer or VesselFinder
- **Why:** Historical data from 2009, comprehensive archives
- **Cost:** Variable based on data volume
- **Formats:** XLS, CSV, JSON, XML
- **Use Cases:** Academic research, compliance, investigations

### Budget / Developer Testing
**Recommended:** AISHub (if you can contribute data) or AISstream.io
- **Why:** Free access with caveats
- **Cost:** Free (AISHub requires data sharing, AISstream.io is fully free)
- **Coverage:** Community-driven (AISHub) or global (AISstream.io)
- **Limitation:** Quality depends on community (AISHub)

### Military / Naval Vessel Tracking
**Recommended:** Multi-INT OSINT Approach (SAR + Optical + RF)
- **Why:** AIS-based APIs are insufficient for military vessels
- **Primary Tool:** Sentinel-1 SAR imagery (free, Copernicus program)
- **Secondary:** Optical satellite imagery (Google Earth, Planet Labs)
- **Advanced:** RF detection (commercial providers emerging)
- **AIS Baseline:** MarineTraffic or VesselFinder (for occasional broadcasts)
- **Limitation:** Requires technical expertise, lower temporal resolution

---

## API Comparison Matrix

| API Provider | Military Vessels | Real-Time | Historical | WebSocket | Satellite AIS | Pricing | Best For |
|--------------|------------------|-----------|------------|-----------|---------------|---------|----------|
| **MarineTraffic** | No | Yes | Yes | No | Yes (extra cost) | Enterprise | Mission-critical, large fleets |
| **VesselFinder** | No | Yes | Yes (from 2009) | No | Yes (10cr/pos) | Credit-based | General tracking, historical |
| **Spire Maritime** | No | Yes (best) | Yes | No | Yes (proprietary) | Enterprise | Best latency, global coverage |
| **ORBCOMM** | No | Yes | Yes | No | Yes (own constellation) | Enterprise | Cost-effective enterprise |
| **AISHub** | No | Yes | Limited | No | No | Free (contribute) | Budget, community projects |
| **AISstream.io** | No | Yes | No | **YES** | Varies | **FREE** | Real-time streaming, developers |
| **Datalastic** | No | Yes (minutely) | Yes | No | No | Credit-based | Fast, affordable, self-service |
| **MyShipTracking** | No | Yes | Yes | No | No (terrestrial only) | Credit-based | Fleet management, nearshore |
| **VT Explorer** | No | Yes | Yes (from 2009) | No | Yes (10cr/pos) | Credit/subscription | Historical research, analysis |

**Key:**
- **Military Vessels:** Dedicated military vessel tracking (all are "No" due to SOLAS exemptions)
- **Real-Time:** Live AIS position updates
- **Historical:** Access to historical track data
- **WebSocket:** Real-time streaming push protocol
- **Satellite AIS:** Global open-ocean coverage
- **Pricing:** General pricing model

---

## Critical Findings & Conclusions

### Military Vessel Tracking is Severely Limited via AIS

1. **SOLAS Exemption:** Military vessels are legally exempt from AIS requirements under international maritime law.

2. **Operational Security:** Naval vessels routinely disable AIS transponders during operations, making them invisible to commercial tracking APIs.

3. **AIS Spoofing:** Military and covert operations vessels can transmit false AIS data, making even "visible" vessels unreliable.

4. **Commercial API Limitations:** No commercial AIS API provider offers dedicated military vessel tracking because the data simply doesn't exist in most cases.

### Alternative Methods Are Necessary

To track military vessels, you must use:
- **Synthetic Aperture Radar (SAR)** satellites (e.g., Sentinel-1)
- **Optical satellite imagery** (e.g., Google Earth, Planet Labs)
- **Radio Frequency (RF) detection** (emerging commercial services)
- **Multi-intelligence (Multi-INT)** approaches combining multiple sources

These methods require significantly more technical expertise than AIS APIs.

### Best Civilian Vessel Tracking Solutions

For **commercial vessel tracking** (the primary use case for AIS APIs):

- **Best Real-Time Streaming (Free):** AISstream.io
- **Best REST API (Affordable):** Datalastic or VesselFinder
- **Best Enterprise Solution:** Spire Maritime or MarineTraffic
- **Best Historical Data:** VT Explorer or VesselFinder (from 2009)
- **Best Budget Option:** AISHub (if you can contribute data) or AISstream.io (no contribution required)

### Technical Implementation Recommendations

1. **Start with AISstream.io** for real-time streaming if you need live updates
2. **Use Datalastic REST API** for general polling and flexibility
3. **Add Spire Maritime** if you need enterprise SLAs and best-in-class latency
4. **Consider multi-provider strategy** for redundancy and coverage gaps
5. **Implement geographic filtering** to reduce costs and improve performance
6. **Cache vessel master data** (IMO, name, type) to avoid repeated queries

### Cost Optimization Strategies

1. **Use WebSocket streaming** (AISstream.io) instead of polling to reduce API calls
2. **Filter by geographic area** to track only relevant vessels
3. **Cache static data** (vessel particulars) - they rarely change
4. **Use bulk endpoints** when tracking multiple vessels (up to 100 per call)
5. **Choose credit-based pricing** for unpredictable usage patterns
6. **Monitor credit consumption** to avoid unexpected charges
7. **Start with free tier** (AISstream.io, AISHub trial) for prototyping

---

## Sources & References

### MarineTraffic
- [MarineTraffic: Global Ship Tracking Intelligence](https://www.marinetraffic.com/)
- [AIS API Documentation](https://servicedocs.marinetraffic.com/)
- [API Services](https://support.marinetraffic.com/en/articles/9552659-api-services)

### VesselFinder
- [Ship AIS Position and Voyage data - AIS API](https://www.vesselfinder.com/vessel-positions-api)
- [API for AIS Data](https://api.vesselfinder.com/docs/)
- [AIS Data – API for Real-Time AIS ship positions](https://www.vesselfinder.com/realtime-ais-data)
- [Historical AIS Data](https://www.vesselfinder.com/historical-ais-data)

### Spire Maritime
- [Marine AIS Data - Maritime AIS vessel tracking solutions](https://maritime.spire.com/)
- [Configure your AIS solution](https://maritime.spire.com/pricing/)
- [Global ship tracking: Complete tracking from coast to deep ocean](https://spire.com/maritime/)

### ORBCOMM
- [Maritime AIS Data | ORBCOMM](https://www.orbcomm.com/en/solutions/maritime/ais-data)

### Free & Community APIs
- [Free AIS vessel tracking | AISHub](https://www.aishub.net/)
- [AIS data API (XML / JSON / CSV Webservice) | AISHub](https://www.aishub.net/api)
- [aisstream.io](https://aisstream.io/)
- [GitHub - aisstream/aisstream](https://github.com/aisstream/aisstream)

### Datalastic
- [Pricing - Datalastic - Marine Tracking API & Database](https://datalastic.com/pricing/)
- [Vessel Tracking API & Ship AIS Database | Datalastic](https://datalastic.com/)
- [API Reference - Datalastic](https://datalastic.com/api-reference/)

### MyShipTracking
- [MyShipTracking API Services](https://api.myshiptracking.com/)
- [Bulk Vessel Retrieval API Endpoint](https://api.myshiptracking.com/docs/vessels-current-position-api)

### VT Explorer
- [AIS Data API | VT Explorer](https://www.vtexplorer.com/ais-data-en/)
- [AIS Data API - VT Explorer](https://api.vtexplorer.com/docs/)
- [Historical AIS Data and Port Calls | VT Explorer](https://www.vtexplorer.com/historical-data-en/)

### AIS Standards & Technical Documentation
- [AIS Requirements | Navigation Center](https://www.navcen.uscg.gov/ais-requirements)
- [AIS transponders - IMO](https://www.imo.org/en/ourwork/safety/pages/ais.aspx)
- [Automatic identification system - Wikipedia](https://en.wikipedia.org/wiki/Automatic_identification_system)
- [AIS Fundamentals | Spire Maritime Documentation](https://documentation.spire.com/ais-fundamentals/ais-data-sources/dynamic-ais/)
- [AIS Frequently Asked Questions | Navigation Center](https://www.navcen.uscg.gov/ais-frequently-asked-questions)

### Military Vessels & SOLAS Regulations
- [Safety of Life at Sea (SOLAS) Convention, Chapter V](https://www.navcen.uscg.gov/sites/default/files/pdf/AIS/AIS_Regs_SOLAS_MTSA_2015.pdf)
- [SOLAS Chapter V, Regulation 19.2](https://www.navcen.uscg.gov/sites/default/files/pdf/AIS/SOLAS.V.19.2.1-5.pdf)
- [NATO Shipping Centre - AIS Overview](https://shipping.nato.int/nsc/media-centre/news-archive/2021/ais-automatic-identification-system-overview)

### Alternative Tracking & OSINT Methods
- [AIS Data Providers for Maritime Vessel Tracking](https://www.darkshipping.com/post/ais-data-providers)
- [OSINT TOOLKIT: MARINETRAFFIC](https://www.counterterrorismgroup.com/post/osint-toolkit-marinetraffic-a-real-time-vessel-tracking-tool-that-enhances-maritime-security-and-v)
- [Sailing through the spyglass: The strategic advantages of blue OSINT - Atlantic Council](https://www.atlanticcouncil.org/in-depth-research-reports/issue-brief/sailing-through-the-spyglass-the-strategic-advantages-of-blue-osint-ubiquitous-sensor-networks-and-deception/)
- [Maritime OSINT : In Detail (Part II) | OSINT JOURNO](https://medium.com/osint-journo/maritime-osint-in-detail-part-ii-6b6c1a420129)
- [Hidden Threat To Navies: How Freely Available Satellite Imagery Can Track Radars - Naval News](https://www.navalnews.com/naval-news/2020/12/hidden-threat-to-navies-how-freely-available-satellite-imagery-can-track-radars/)
- [Understanding AIS data - SeaRoutes](https://developer.searoutes.com/docs/vessel-tracking-and-ais-data)

### Update Frequency & Latency
- [Real-Time AIS Data: What it Means and Who to Trust](https://www.darkshipping.com/post/real-time-ais-data)
- [How often do the positions of the vessels get updated on MarineTraffic?](https://help.marinetraffic.com/hc/en-us/articles/217631867-How-often-do-the-positions-of-the-vessels-get-updated-on-MarineTraffic)

---

**Document Version:** 1.0
**Last Updated:** January 16, 2026
**Research Conducted By:** Claude (Anthropic)
**Purpose:** Technical research for maritime vessel tracking implementation
