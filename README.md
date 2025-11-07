# Skin Analysis Web Application

A **frontend-only** React application for AI-powered skin analysis. This app connects to an external PHP backend for processing skin images and providing personalized recommendations.

## Quick Start

### Prerequisites
- Node.js 18+ or 20+
- npm package manager

### Installation & Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

The app will be available at `http://localhost:5000`

### Build for Production

```bash
# Create production build
npm run build
```

Output files will be in `dist/public/` directory.

## Project Structure

```
skin-analysis-app/
├── client/                # Frontend application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── lib/          # API client and utilities
│   │   ├── hooks/        # Custom React hooks
│   │   ├── types/        # TypeScript types
│   │   └── App.tsx       # Main app component
│   ├── public/           # Static assets
│   └── index.html        # HTML entry point
├── attached_assets/      # Images and media
├── server/               # Vite launcher (not a backend server)
├── vite.config.ts        # Vite configuration
├── tailwind.config.ts    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies
```

**Note:** The `server/` folder only contains a launcher script for Vite. This is NOT a backend server - the app is purely frontend and connects to your external PHP backend.

## Features

- ✅ Multi-step user flow (Consent → Upload → Analysis → Results)
- ✅ Three image upload methods (file, gallery, camera)
- ✅ Google Maps address autocomplete
- ✅ Real-time camera capture with front/back toggle
- ✅ Responsive Material Design UI
- ✅ Form validation with Zod
- ✅ Loading states and progress indicators
- ✅ Feedback submission system

## Configuration

### 1. External API Backend

Update the PHP backend URL in `client/src/lib/api.ts`:

```typescript
const API_BASE_URL = 'https://your-php-backend.com';
```

Your PHP backend must implement:
- `POST /analyze` - Accepts FormData with consent info and images
- `POST /feedback` - Accepts feedback suggestions

### 2. Google Maps API

Add your API key in `client/index.html`:

```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places"></script>
```

Make sure to enable the Places API in your Google Cloud Console.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions including:
- Static hosting (Apache, Nginx, CDN)
- Server configuration for SPA routing
- Production checklist
- Troubleshooting guide

### Quick Deploy Steps

1. Build the production files:
   ```bash
   npm run build
   ```

2. Upload the `dist/public/` folder to your web server

3. Configure your server for SPA routing (see DEPLOYMENT.md)

4. Update API URLs and Google Maps key

That's it! Your frontend is ready to serve.

## Technology Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **React Hook Form + Zod** - Form validation
- **TanStack Query** - Server state management
- **Wouter** - Client-side routing

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run check` - Type check with TypeScript

### Development Notes

- The app uses Vite's hot module replacement (HMR)
- TypeScript strict mode is enabled
- Tailwind CSS with custom design tokens
- All components use TypeScript for type safety

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ required
- No IE11 support

## License

MIT

## Support

For deployment issues, check [DEPLOYMENT.md](DEPLOYMENT.md).
For code documentation, see [replit.md](replit.md).
