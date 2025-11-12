import { sessionStorage, PatientSessionData, AirQualityData, WeatherData } from './sessionStorage';

export const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

export const API_ENDPOINTS = {
  analyze: `${API_BASE_URL}/route.php?type=${btoa('analysis')}`,
  feedback: `${API_BASE_URL}/route.php?type=${btoa('feedback')}`,
  personalizeMagic: `${API_BASE_URL}/route.php?type=${btoa('personalize-magic')}`,
};

export interface AnalysisRequestData {
  patientData: PatientSessionData;
  airQuality?: AirQualityData | null;
  image: string;
}

export async function analyzeImages(images: string[]) {
  const patientData = sessionStorage.getPatientData();
  const airQuality = sessionStorage.getAirQuality();
  const weather = sessionStorage.getWeather();

  if (!patientData) {
    throw new Error('Patient data not found in session. Please start from the beginning.');
  }

  if (images.length === 0) {
    throw new Error('No images provided');
  }

  const image = images[0];

  // Extract minimal air quality data
  let airQualitySummary: AirQualitySummary | null = null;
  if (airQuality && airQuality.aqi && airQuality.category) {
    let pm2_5: number | null = null;
    let pm10: number | null = null;
    
    if (airQuality.pollutants && Array.isArray(airQuality.pollutants)) {
      const pm25Pollutant = airQuality.pollutants.find((p: any) => p.code === 'pm2.5' || p.code === 'pm25');
      const pm10Pollutant = airQuality.pollutants.find((p: any) => p.code === 'pm10');
      
      pm2_5 = pm25Pollutant?.concentration?.value ?? null;
      pm10 = pm10Pollutant?.concentration?.value ?? null;
    }
    
    airQualitySummary = {
      aqi: airQuality.aqi,
      category: airQuality.category,
      pm2_5,
      pm10,
    };
  }
  
  // Extract minimal weather data
  let weatherSummary: WeatherSummary | null = null;
  if (weather && weather.temperature) {
    weatherSummary = {
      temperatureValue: weather.temperature.value,
      temperatureUnit: weather.temperature.unit,
      humidity: weather.humidity ?? null,
      uvIndex: weather.uvIndex ?? null,
    };
  }

  const formData = new FormData();
  formData.append('image', image);
  formData.append('user_detail', JSON.stringify(patientData));
  formData.append('air_quality', JSON.stringify(airQualitySummary));
  formData.append('weather', JSON.stringify(weatherSummary));

  const response = await fetch(API_ENDPOINTS.analyze, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Analysis failed: ${errorText}`);
  }

  return response.json();
}

export async function submitFeedback(suggestion: string, email: string) {
  const response = await fetch(API_ENDPOINTS.feedback, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ suggestion, email }),
  });

  if (!response.ok) {
    throw new Error('Feedback submission failed');
  }

  return response.json();
}

export interface AirQualitySummary {
  aqi: number;
  category: string;
  pm2_5: number | null;
  pm10: number | null;
}

export interface WeatherSummary {
  temperatureValue: number;
  temperatureUnit: string;
  humidity: number | null;
  uvIndex: number | null;
}

export interface PersonalizeMagicRequest {
  userData: {
    fullName?: string;
    age?: number;
    gender?: string;
    skinType?: string;
    topConcern?: string[];
    location?: {
      city?: string;
      state?: string;
      country?: string;
    };
  };
  airQuality?: AirQualitySummary | null;
  weather?: WeatherSummary | null;
}

export interface PersonalizeMagicResponse {
  personalizedText?: string;
  error?: string;
}

export async function getPersonalizedMagicText(data: PersonalizeMagicRequest): Promise<PersonalizeMagicResponse> {
  try {
    const response = await fetch(API_ENDPOINTS.personalizeMagic, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Personalize magic API error:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to generate personalized text',
    };
  }
}
