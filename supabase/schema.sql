-- Enable PostGIS extension for geographic queries
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Aircraft tracking table
CREATE TABLE IF NOT EXISTS military_aircraft (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  icao24 TEXT NOT NULL,                    -- ICAO 24-bit hex identifier
  callsign TEXT,                           -- Flight callsign
  country TEXT,                            -- Country of registration
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  altitude INTEGER,                        -- Altitude in meters
  velocity INTEGER,                        -- Speed in m/s
  heading INTEGER,                         -- True track in degrees
  vertical_rate INTEGER,                   -- Vertical rate in m/s
  on_ground BOOLEAN DEFAULT FALSE,         -- Is aircraft on ground
  is_military BOOLEAN DEFAULT FALSE,       -- Military flag (heuristic)
  last_contact TIMESTAMP NOT NULL,         -- Last ADS-B contact
  data_source TEXT,                        -- API provider (opensky, aviationstack, etc)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(icao24)
);

-- Maritime vessel tracking table
CREATE TABLE IF NOT EXISTS military_vessels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mmsi TEXT NOT NULL,                      -- Maritime Mobile Service Identity
  imo TEXT,                                -- International Maritime Org number
  vessel_name TEXT,
  vessel_type TEXT,
  flag TEXT,                               -- Country of registration
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  speed DOUBLE PRECISION,                  -- Speed in knots
  course INTEGER,                          -- Course over ground (degrees)
  heading INTEGER,                         -- True heading (degrees)
  navigation_status TEXT,
  draught DOUBLE PRECISION,                -- Current draught in meters
  destination TEXT,                        -- Destination port
  eta TIMESTAMP,                           -- Estimated time of arrival
  is_military BOOLEAN DEFAULT FALSE,       -- Military flag (heuristic)
  last_contact TIMESTAMP NOT NULL,
  data_source TEXT,                        -- API provider
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(mmsi)
);

-- Indexes for fast geographic queries using PostGIS
CREATE INDEX IF NOT EXISTS idx_aircraft_position ON military_aircraft
  USING GIST (ST_MakePoint(longitude, latitude));

CREATE INDEX IF NOT EXISTS idx_aircraft_country ON military_aircraft(country);
CREATE INDEX IF NOT EXISTS idx_aircraft_updated ON military_aircraft(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_aircraft_icao24 ON military_aircraft(icao24);
CREATE INDEX IF NOT EXISTS idx_aircraft_military ON military_aircraft(is_military) WHERE is_military = TRUE;

CREATE INDEX IF NOT EXISTS idx_vessel_position ON military_vessels
  USING GIST (ST_MakePoint(longitude, latitude));

CREATE INDEX IF NOT EXISTS idx_vessel_flag ON military_vessels(flag);
CREATE INDEX IF NOT EXISTS idx_vessel_updated ON military_vessels(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_vessel_mmsi ON military_vessels(mmsi);
CREATE INDEX IF NOT EXISTS idx_vessel_military ON military_vessels(is_military) WHERE is_military = TRUE;

-- Track API usage and performance
CREATE TABLE IF NOT EXISTS api_usage_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT NOT NULL,                  -- opensky, aviationstack, aishub, datalastic
  vehicle_type TEXT NOT NULL,              -- aircraft or vessel
  api_calls INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  records_fetched INTEGER DEFAULT 0,
  avg_response_time INTEGER,               -- milliseconds
  last_call TIMESTAMP,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider, vehicle_type, date)
);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update timestamps
CREATE TRIGGER update_aircraft_updated_at BEFORE UPDATE ON military_aircraft
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vessel_updated_at BEFORE UPDATE ON military_vessels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up old data (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_vehicle_data()
RETURNS void AS $$
BEGIN
  DELETE FROM military_aircraft WHERE updated_at < NOW() - INTERVAL '24 hours';
  DELETE FROM military_vessels WHERE updated_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) - Enable public read access
ALTER TABLE military_aircraft ENABLE ROW LEVEL SECURITY;
ALTER TABLE military_vessels ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_stats ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous read access to vehicle data
CREATE POLICY "Allow public read access to aircraft"
  ON military_aircraft FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to vessels"
  ON military_vessels FOR SELECT
  USING (true);

-- Policy: Only service role can insert/update vehicle data
CREATE POLICY "Service role can insert aircraft"
  ON military_aircraft FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update aircraft"
  ON military_aircraft FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can insert vessels"
  ON military_vessels FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update vessels"
  ON military_vessels FOR UPDATE
  USING (auth.role() = 'service_role');

-- Policy: Only service role can access stats
CREATE POLICY "Service role can read stats"
  ON api_usage_stats FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can insert stats"
  ON api_usage_stats FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Create views for common queries
CREATE OR REPLACE VIEW recent_aircraft AS
  SELECT * FROM military_aircraft
  WHERE updated_at > NOW() - INTERVAL '5 minutes'
  ORDER BY updated_at DESC;

CREATE OR REPLACE VIEW recent_vessels AS
  SELECT * FROM military_vessels
  WHERE updated_at > NOW() - INTERVAL '5 minutes'
  ORDER BY updated_at DESC;

CREATE OR REPLACE VIEW military_only_aircraft AS
  SELECT * FROM military_aircraft
  WHERE is_military = TRUE
  AND updated_at > NOW() - INTERVAL '5 minutes'
  ORDER BY updated_at DESC;

CREATE OR REPLACE VIEW military_only_vessels AS
  SELECT * FROM military_vessels
  WHERE is_military = TRUE
  AND updated_at > NOW() - INTERVAL '5 minutes'
  ORDER BY updated_at DESC;

-- Grant access to views
GRANT SELECT ON recent_aircraft TO anon, authenticated;
GRANT SELECT ON recent_vessels TO anon, authenticated;
GRANT SELECT ON military_only_aircraft TO anon, authenticated;
GRANT SELECT ON military_only_vessels TO anon, authenticated;

-- Comment on tables for documentation
COMMENT ON TABLE military_aircraft IS 'Real-time aircraft tracking data from ADS-B APIs';
COMMENT ON TABLE military_vessels IS 'Real-time maritime vessel tracking data from AIS APIs';
COMMENT ON TABLE api_usage_stats IS 'API usage metrics and performance tracking';
