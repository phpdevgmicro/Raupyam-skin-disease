# Raupyam - AI-Powered Skin Analysis Application

## Overview

Raupyam is a healthcare-focused web application that provides AI-powered skin analysis. Users complete a consent form with personal information, upload skin images through multiple methods (file upload, gallery, or camera), and receive detailed analysis with personalized recommendations. The application follows Material Design principles adapted for medical contexts, emphasizing trust, clarity, and accessibility.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript and Vite as the build tool

**UI Component System**: shadcn/ui components built on Radix UI primitives
- Provides accessible, unstyled components that can be customized
- Includes comprehensive form controls, dialogs, cards, and feedback components
- All components are co-located in `client/src/components/ui/`

**Styling Solution**: Tailwind CSS with custom design tokens
- Custom color system using HSL values with CSS variables for theming
- Design follows "New York" style variant from shadcn/ui
- Typography uses Inter font family with defined hierarchy (H1: 2.5rem, H2: 1.75rem, H3: 1.25rem)
- Spacing based on Tailwind's standard units (4, 6, 8, 12, 16, 24)

**Form Management**: React Hook Form with Zod validation
- Type-safe form validation using Zod schemas
- Schemas defined in `shared/schema.ts` for reusability
- Resolver integration via `@hookform/resolvers/zod`

**State Management**: React Query (TanStack Query)
- Handles server state and caching
- Custom query client configuration in `client/src/lib/queryClient.ts`
- Configured with disabled refetching and infinite stale time

**Routing**: Wouter for client-side routing
- Lightweight alternative to React Router
- Simple Switch/Route pattern for navigation

**Session Storage**: Browser session storage for temporary data persistence
- Stores patient data (including coordinates) during the analysis workflow
- Stores air quality data fetched in the background
- Stores uploaded images
- No Redux or complex state management needed
- Data cleared when starting a new analysis
- Utility functions in `src/lib/sessionStorage.ts`

### Multi-Step User Flow

**Step 1 - Consent Form**: 
- Collects personal information (name, age, gender, skin type)
- Google Places Autocomplete integration for address input
- Auto-populates city, state, and country from selected address (fields are read-only until address is selected)
- If city, state, or country are not auto-filled, fields become editable for manual entry
- Geocodes address to coordinates (latitude/longitude) using Google Geocoding API
- Triggers background air quality API call (non-blocking)
- Stores patient data and coordinates in browser session storage
- Responsive grid layout (single column mobile, two columns desktop)

**Step 2 - Image Upload**:
- Two upload methods: file upload or camera capture
- Camera interface uses react-webcam with front/back camera toggle
- Single image upload only (one image analyzed at a time)
- Base64 encoding for image handling
- Option to change or remove the uploaded image

**Step 3 - Analysis Loading**:
- Full-screen loading overlay with animated spinner
- Progress indicators and estimated time display

**Step 4 - Results Display**:
- Severity-based color coding (mild/moderate/severe)
- Detailed analysis text
- List of personalized recommendations
- Feedback form for user suggestions

### Backend Architecture

**Server Framework**: Express.js with TypeScript
- Minimal backend implementation as analysis is delegated to external PHP service
- Vite middleware integration for development
- Request logging with duration tracking

**API Integration**: PHP backend for AI analysis
- Frontend retrieves patient data and air quality from session storage
- Sends FormData with patient information, air quality data, and image to PHP backend
- Backend validates inputs and uses fallback logic to fetch air quality if not provided
- Uses OpenAI GPT-4.1-mini model for skin analysis via `api/classes/open-ai.php`
- API endpoints in `api/route.php`: `/analyze` for image analysis, `/feedback` for user feedback
- No PHP sessions used - all data comes from frontend request body
- Uploads analyzed images to Google Drive and stores data in MySQL database and Google Sheets

**Build Process**:
- Frontend: Vite builds to `dist/public`
- Backend: esbuild bundles server code to `dist` with ESM format
- Production server serves static files from build output

### Data Schema Design

**Consent Form Schema**:
- Full name (minimum 2 characters)
- Age (1-120, coerced to number)
- Gender (enum: male, female, other, prefer-not-to-say)
- Skin type (enum: oily, dry, combination, sensitive, normal)
- Address with auto-populated city, state, country

**Analysis Request/Response**:
- Request: patient data (with coordinates) + air quality data (string format) + single base64 image
- Response: analysis text with status (success/error) and result message
- Air quality data format: "AQI: {value}, Category: {category}, Dominant Pollutant: {pollutant}"
- Backend fallback: If air quality not provided, fetches it using coordinates via `ADMIN::airQuality()`

**Form Validation**: Zod schemas provide runtime type checking and validation
- Shared between client and server via `shared/schema.ts`
- Type inference creates TypeScript types from schemas

### Design System

**Color Palette**: Neutral-based with healthcare-appropriate tones
- Primary: Blue (hsl(210, 82%, 42%)) for trust and professionalism
- Semantic colors for severity: green (mild), yellow (moderate), red (severe)
- Light mode optimized with subtle borders and elevations

**Component Patterns**:
- Cards with rounded corners (9px) and subtle shadows
- Buttons with hover/active elevation states
- Form inputs at 36px height (h-9) for consistency
- Progressive disclosure for complex flows

**Responsive Breakpoints**:
- Mobile-first approach
- Desktop enhancements at md breakpoint (768px)
- Grid layouts that collapse to single column on mobile

## External Dependencies

### Third-Party Services

**Google Maps APIs**: Address autocomplete, geocoding, and air quality
- API key configured in `VITE_GOOGLE_MAPS_API_KEY` environment variable
- Must enable Geocoding API and Air Quality API in Google Cloud Console
- **Places API**: Address autocomplete with structured data (street, city, state, country)
- **Geocoding API**: Converts addresses to coordinates (latitude/longitude)
- **Air Quality API**: Fetches air quality data based on coordinates for enhanced skin analysis
- Loaded asynchronously with places library

**External PHP Backend**: AI-powered skin analysis service
- Must implement `/analyze` endpoint accepting FormData
- Expected to return JSON with analysis, recommendations, and severity
- Must implement `/feedback` endpoint for user suggestions
- Base URL configured in `client/src/lib/api.ts` (currently placeholder)

### Key NPM Dependencies

**UI Framework**:
- `react` and `react-dom`: Core React library
- `@radix-ui/*`: Primitive UI components (20+ packages)
- `tailwindcss`: Utility-first CSS framework
- `class-variance-authority`: Component variant management
- `lucide-react`: Icon library

**Forms & Validation**:
- `react-hook-form`: Form state management
- `zod`: Schema validation
- `@hookform/resolvers`: Zod integration for React Hook Form

**Development**:
- `vite`: Build tool and dev server
- `typescript`: Type checking
- `tsx`: TypeScript execution for development
- `esbuild`: Production server bundling

**Utilities**:
- `wouter`: Client-side routing
- `@tanstack/react-query`: Server state management
- `react-webcam`: Camera capture functionality
- `clsx` and `tailwind-merge`: Class name utilities

### Database

**ORM**: Drizzle ORM configured for PostgreSQL
- Schema defined in `shared/schema.ts`
- Migrations output to `./migrations`
- Database connection via `@neondatabase/serverless`
- Note: Currently minimal schema (User table only), main data processing happens in external PHP service

## Recent Changes (November 2025)

### Initial Integration (Early November)
- Integrated Google Air Quality API to enhance skin analysis with environmental factors
- Implemented session storage system (no Redux) for temporary data persistence
- Changed from multi-image to single-image upload for focused analysis
- Updated consent form to geocode addresses and fetch air quality in the background
- Modified PHP backend to receive data from request body instead of PHP sessions
- Made city, state, and country fields read-only until address is selected, then editable if values are missing
- Fixed Google Maps API key configuration in index.html

### Shared Hosting Optimization (November 6, 2025)
- **Frontend Air Quality API**: Added `universalAqi` and `extraComputations` fields to match backend requirements for richer pollution data
- **Backend Cleanup**: Removed redundant air quality method from `api/classes/admin.php` and fallback logic from `api/route.php` (frontend now handles all air quality fetching)
- **File Upload Optimization**: Google Drive uploads now stream decoded bytes directly from memory instead of creating temporary files (faster and safer)
- **Package Optimization**: Removed 8 unused dependencies (date-fns, embla-carousel-react, next-themes, openai, react-icons, tw-animate-css, zod-validation-error, @jridgewell/trace-mapping)
- **Build Performance**: Production build optimized to 543.94 kB (170.94 kB gzipped), suitable for shared hosting deployment
- **Code Quality**: Removed unused carousel component to eliminate LSP errors
- **Air Quality Data Optimization**: Enhanced formatAirQualityForAI to send complete environmental data to OpenAI:
  - Now includes ALL AQI indexes (Universal AQI, regional indexes like NAQI for India) instead of single value
  - Removed pollutant filtering - sends all 7 pollutants (CO, NO2, O3, PM10, PM2.5, SO2, NH3) instead of only 5
  - Improved formatting with structured sections for better AI parsing and analysis
  - Maintains backward compatibility with fallback for legacy data format

### Raupyam Branding & HTML Formatting (November 6, 2025)
- **Branding Update**: Renamed application to "Raupyam" across all pages and documentation
  - Updated Header component to display actual Raupyam logo (dark charcoal text with colorful stripe)
  - Logo asset: attached_assets/logo_1762464998914.png
  - Updated page title to "Raupyam - AI-Powered Skin Analysis & Care"
  - Updated meta description for SEO optimization
  - Created professional SVG favicon at public/favicon.svg
- **HTML-Formatted AI Responses**: Implemented HTML rendering for AI analysis results
  - Updated AnalysisResults component to render HTML content instead of plain text
  - Integrated DOMPurify for secure HTML sanitization (prevents XSS attacks)
  - Configured allowed tags: p, br, strong, em, u, h1-h6, ul, ol, li, small, span, div
  - Added Tailwind Typography (prose classes) for beautiful text formatting
  - Used useMemo to optimize sanitization performance
- **Complete Code & Package Cleanup**: Comprehensive optimization for production
  - **Total Packages Removed**: 58 unused packages
    - Initial cleanup: 42 packages (input-otp, react-day-picker, recharts, etc.)
    - Additional cleanup: 22 packages (framer-motion, 21 @radix-ui components)
    - Reduced from 310 to 274 total packages
  - **UI Component Files**: Reduced from 47 to 11 essential components
    - Kept only: badge, button, card, form, input, label, select, textarea, toast, toaster, tooltip
    - Removed 36 unused component files
  - **Code Optimization**: Replaced framer-motion animations with CSS transitions in skin-analysis.tsx
- **Theme Alignment with Logo**: Updated color scheme to match Raupyam branding
  - **Design**: Dark charcoal text (0 0% 18%) with multicolor stripe (blue, yellow, green, red)
  - **Primary Color**: Blue from logo stripe (217 91% 55%)
  - **Accent Color**: Green from logo stripe (142 76% 45%)
  - **Chart Colors**: Vibrant colors from logo stripe
  - **Base Theme**: Neutral grays with subtle tints
  - Both light and dark modes aligned with brand identity
- **Database Prompt Update**: Created SQL file and documentation for updating OpenAI vision prompt
  - Added instructions in OPENAI_PROMPT_UPDATE.md for database update
  - Provided update_openai_prompt.sql for direct execution on MySQL database
  - Prompt now requests structured HTML output with proper semantic tags