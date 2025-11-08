import { useState } from 'react';
import logoImage from '@assets/logo_1762464998914.png';

export default function Header() {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4 md:py-5">
        <div className="flex items-center justify-center">
          <div className="relative h-10 md:h-12">
            {!imageLoaded && (
              <div className="h-10 md:h-12 w-32 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse rounded" />
            )}
            <img 
              src={logoImage} 
              alt="Raupyam" 
              className={`h-10 md:h-12 w-auto transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
              data-testid="img-logo"
              onLoad={() => setImageLoaded(true)}
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
