# Raupyam - AI-Powered Skin Analysis Application

## Overview

Raupyam is a healthcare-focused web application that provides AI-powered skin analysis. Users complete a consent form, upload skin images, and receive detailed analysis with personalized recommendations. The application follows Material Design principles adapted for medical contexts, emphasizing trust, clarity, and accessibility, with a business vision to provide accessible and accurate skin health insights.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript and Vite.
**UI Component System**: shadcn/ui components built on Radix UI, located in `client/src/components/ui/`.
**Styling**: Tailwind CSS with custom HSL-based design tokens, "New York" style variant, and Inter font family.
**Form Management**: React Hook Form with Zod validation for type-safe forms, schemas in `shared/schema.ts`.
**State Management**: React Query (TanStack Query) for server state and caching.
**Routing**: Wouter for lightweight client-side navigation.
**Session Storage**: Browser session storage for temporary data persistence during workflow, including patient data, air quality, and uploaded images.

### Multi-Step User Flow

The application guides users through a multi-step process:
1.  **Consent Form**: Collects personal info, integrates Google Places Autocomplete for address, geocodes for coordinates, and triggers background air quality API call. Features "Behind the Scenes" accordion that shows personalized skincare insights based on auto-detected location and environmental data immediately upon opening - no profile data required. Optional profile fields (age, gender, skin type, concerns) enhance personalization when provided.
2.  **Image Upload**: Allows single image upload via file or camera capture (using react-webcam), with Base64 encoding.
3.  **Analysis Loading**: Displays a full-screen loading overlay.
4.  **Results Display**: Shows severity-based color-coded analysis, personalized recommendations, and a feedback form.

### Backend Architecture

**Server Framework**: Express.js with TypeScript, acting as a minimal proxy to an external PHP service.
**API Integration**: Communicates with a PHP backend for AI analysis. The frontend sends only useful and relevant data - user profile fields, minimal air quality summary, minimal weather summary, and image. The PHP backend uses OpenAI GPT-4.1-mini for analysis, stores data in MySQL and Google Sheets, and uploads images to Google Drive.
**Data Flow Philosophy**: Frontend extracts and sends only relevant fields from collected data to backend APIs. This reduces payload size and improves performance while providing all necessary information for analysis.
**Retry Loop Prevention**: Implements hash-based tracking to prevent infinite API retry loops. When an API call fails, the system won't retry unless the user profile changes or an explicit retry is requested.
**Build Process**: Vite for frontend (to `dist/public`), esbuild for backend (to `dist`).

### Data Schema Design

**Consent Form Schema**: Validated with Zod, includes full name, age, gender, skin type, concerns, and complete address details (cityName, city, state, country).

**Personalize Magic Request**: Sends structured payload with loading state protection:
- **Payload Structure**: `{ userData, environmentData }` matching PHP backend expectations
- **User Data**: `{ age, gender, skinType, topConcern }`
- **Environment Data**: `{ city, aqi, aqiCategory, dominantPollutant, temperature, feelsLike, humidity, humidityCategory, uvIndex, windSpeed, weatherDesc, waterHardness, pm25, pm10, co, no2, so2, o3 }`
- **Loading Gate**: `isEnvLoading` state flag prevents stale data - API calls blocked until environmental data finishes fetching for new location
- **Pollutant Extraction**: Normalized code matching (lowercase, strip dots/underscores) handles Google API variations (pm2.5, PM2_5, pm25)
- **Humidity Categories**: Low (0-40%), Medium (41-70%), High (71-100%) with null/undefined as "Medium"

**Analysis Request**: Sends minimal structured data:
- **Patient Data**: Complete user profile with coordinates
- **Air Quality Summary**: Same minimal structure as Personalize Magic (not full JSON)
- **Weather Summary**: Same minimal structure as Personalize Magic (not full JSON)
- **Image**: Single base64-encoded image

**Backend Response Handling**: Frontend displays backend HTML responses as-is using dangerouslySetInnerHTML (sanitized with DOMPurify) - no frontend text processing or formatting.

### Design System

**Color Palette**: Neutral-based with primary blue, semantic colors for severity (green, yellow, red), and a dark charcoal text based on Raupyam branding.
**Typography**: Main UI uses "Onest" sans-serif, analysis results use "DM Sans" sans-serif for readability.
**Component Patterns**: Cards with rounded corners, buttons with elevation, 44px height for form inputs, and progressive disclosure.
**Responsive Design**: Mobile-first approach with desktop enhancements at `md` breakpoint (768px).
**UX Enhancements**: 
- Icon-based skin type selector
- Pill-style multi-select for concerns (2-item max)
- Increased touch targets/spacing for mobile accessibility (44px+ tap targets)
- Snappy loading animations (200ms zoom-in)
- Auto-closing "Personalize Magic" accordion when form fields change (prevents stale data)
**HTML-Formatted AI Responses**: Analysis results are rendered as HTML, sanitized with DOMPurify, and styled using Tailwind Typography.

## External Dependencies

### Third-Party Services

**Google Maps APIs**: Utilized for Address Autocomplete (Places API), Geocoding (to coordinates), and Air Quality API. Requires API key configuration.
**External PHP Backend**: A separate service responsible for AI-powered skin analysis via `/analyze` and user feedback via `/feedback` endpoints.
**OpenAI**: GPT-4.1-mini model is used by the PHP backend for skin analysis.

### Key NPM Dependencies

**UI Framework**: `react`, `react-dom`, `@radix-ui/*`, `tailwindcss`, `class-variance-authority`, `lucide-react`.
**Forms & Validation**: `react-hook-form`, `zod`, `@hookform/resolvers`.
**Development**: `vite`, `typescript`, `tsx`, `esbuild`.
**Utilities**: `wouter`, `@tanstack/react-query`, `react-webcam`, `clsx`, `tailwind-merge`, `dompurify`.

### Database

**ORM**: Drizzle ORM configured for PostgreSQL.
**Database**: MySQL (used by the external PHP service for data storage), and Google Sheets.