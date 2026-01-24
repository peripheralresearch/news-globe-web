# 🌍 Peripheral

A sophisticated geopolitical intelligence platform featuring interactive 3D globe visualization, real-time news aggregation, and OSINT entity tracking, built with Next.js, Mapbox GL, and Supabase.

[![CI/CD](https://github.com/danielsunyuan/peripheral-webapp/workflows/Next.js%20Application%20Tests/badge.svg)](https://github.com/danielsunyuan/peripheral-webapp/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Quickstart

### Prerequisites
- Node.js 18+
- npm or yarn package manager
- Mapbox GL access token
- Supabase project with configured database
- Stripe account (for payment features)

### Installation
```bash
# Clone the repository
git clone https://github.com/danielsunyuan/peripheral-webapp.git
cd peripheral-webapp

# Install dependencies
npm install

# Set up environment variables
cp env.example .env.local
# Edit .env.local with your actual values:
# - NEXT_PUBLIC_MAPBOX_TOKEN
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY (for server-side operations)
# - STRIPE_SECRET_KEY (optional, for payments)

# Run the development server
npm run dev
```

### Access the Application
Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Architecture

```
web-app/
├── 📁 app/                     # Next.js App Router
│   ├── 📄 page.tsx            # Main globe visualization (1855 lines)
│   ├── 📄 layout.tsx          # Root layout & metadata
│   ├── 📄 globals.css         # Global styles (Tailwind)
│   ├── 📁 api/                # API routes
│   │   ├── sentinel/globe/    # Globe data endpoints
│   │   ├── stories/           # News story endpoints
│   │   ├── proxy-image/       # CORS-safe image proxy
│   │   └── donations/         # Stripe payment integration
│   ├── 📁 components/         # React components
│   │   ├── StoriesFeed.tsx    # Story feed display
│   │   └── globe/             # Globe-specific components
│   └── 📁 [feature]/          # Feature pages (stories, chat, venezuela, iran, ice)
├── 📁 lib/                     # Utilities & configuration
│   ├── supabase/              # Database clients
│   ├── config/                # Environment validation
│   └── types/                 # TypeScript definitions
├── 📁 docs/                    # Comprehensive documentation
├── 📁 public/                  # Static assets & icons
├── 📁 .github/                 # CI/CD workflows
└── 📋 package.json            # Dependencies & scripts
```

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript 5, Tailwind CSS 3.3
- **Framework**: Next.js 14.2.35 (App Router)
- **Visualization**: Mapbox GL JS 2.15.0
- **Database**: Supabase (PostgreSQL with real-time)
- **Payments**: Stripe 19.3.0
- **Deployment**: Vercel (Full Stack)
- **Testing**: Jest 29.7.0 (configured)
- **CI/CD**: GitHub Actions

## 🔧 Key Features

### **Interactive 3D Globe Visualization**
- Real-time geopolitical event plotting from last 48 hours
- Multi-layered pulsing dot animations with glow effects
- Smooth entrance animation (5.5 seconds on load)
- Auto-rotation when idle, click-to-zoom interactions
- Ripple ring animations expanding from clicked locations
- Street/satellite map style toggle
- Country border highlighting with glimmer effects
- Auto zoom-out after 1 minute of inactivity

### **News & Intelligence Aggregation**
- **Stories Feed**: Latest and trending news with time filtering (6h-1week)
- **Entity Enrichment**: Automatic extraction of:
  - Locations (with coordinates and zoom levels)
  - People (with roles and affiliations)
  - Organizations (with types and relationships)
- **OSINT Source Integration**: Multiple source types (Telegram, TV, News)
- **Media Support**: Thumbnail images and video embeds

### **Regional Tracking**
- Country-specific views (Venezuela, Iran)
- ICE video tracking system
- Chat interface integration

### **Backend Services**
- **Secure Image Proxy**: CORS-safe external image fetching with validation
- **Rate Limiting**: Protection against abuse
- **Caching**: 24-hour browser & CDN caching for performance
- **Payment Processing**: Stripe checkout and payment links

## 📚 Documentation

- [Deployment Guide](docs/deployment.md)
- [Frontend Development](docs/frontend.md)
- [CI/CD Pipeline](docs/ci_cd.md)
- [Contributing Guide](docs/contributing.md)
- [Cursor Rules](docs/cursor-rules.md)

## 🤝 Contributing

See [CONTRIBUTING.md](docs/contributing.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Mapbox](https://www.mapbox.com/) for mapping capabilities
- [Supabase](https://supabase.com/) for database and backend services
- [Vercel](https://vercel.com/) for frontend hosting
