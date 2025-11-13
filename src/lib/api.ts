import { sessionStorage, PatientSessionData, AirQualityData, WeatherData } from './sessionStorage';
import { formatPersonalizationData, convertMarkdownToHtml } from './magicSection';
import type { ConsentFormData } from '@/types/schema';

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

  // Use the same formatPersonalizationData function for consistency
  // Convert PatientSessionData to ConsentFormData format
  const formDataFormatted: Partial<ConsentFormData> = {
    fullName: patientData.fullName,
    age: patientData.age,
    gender: patientData.gender,
    skinType: patientData.skinType,
    topConcern: patientData.topConcern,
    cityName: patientData.city || '',
    city: patientData.city || '',
    state: patientData.state || '',
    country: patientData.country || '',
  };

  // Format using the same function as personalize magic
  const personalizationData = formatPersonalizationData(
    formDataFormatted,
    patientData.city || '',
    airQuality,
    weather
  );

  // Extract minimal air quality data for backward compatibility with backend
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
  
  // Extract minimal weather data for backward compatibility with backend
  let weatherSummary: WeatherSummary | null = null;
  if (weather && weather.temperature) {
    weatherSummary = {
      temperatureValue: weather.temperature.value,
      temperatureUnit: weather.temperature.unit,
      humidity: weather.humidity ?? null,
      uvIndex: weather.uvIndex ?? null,
    };
  }

  // Build user_detail using the same filtered data as personalize magic
  // This ensures age: 0 and empty topConcern arrays are not sent
  const userDetail = {
    fullName: patientData.fullName,
    ...personalizationData.userData,  // This includes age, gender, skinType, topConcern (only if valid)
    city: patientData.city,
    state: patientData.state,
    country: patientData.country,
  };

  console.log('[Analysis API] Sending user detail:', JSON.stringify(userDetail, null, 2));
  console.log('[Analysis API] Air quality summary:', JSON.stringify(airQualitySummary, null, 2));
  console.log('[Analysis API] Weather summary:', JSON.stringify(weatherSummary, null, 2));
  console.log('[Analysis API] Complete environment data:', JSON.stringify(personalizationData.environmentData, null, 2));

  const formData = new FormData();
  formData.append('image', image);
  formData.append('user_detail', JSON.stringify(userDetail));
  // Send legacy format for backward compatibility
  formData.append('air_quality', JSON.stringify(airQualitySummary));
  formData.append('weather', JSON.stringify(weatherSummary));
  // Also send complete environment data matching Personalize Magic format
  formData.append('environment_data', JSON.stringify(personalizationData.environmentData));

  const response = await fetch(API_ENDPOINTS.analyze, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Analysis failed: ${errorText}`);
  }

  const result = await response.json();
  
  // Convert markdown formatting to HTML in the result if it contains text
  if (result.result && typeof result.result === 'string') {
    result.result = convertMarkdownToHtml(result.result);
  }

  return result;
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

export interface EnvironmentData {
  city?: string;
  aqi?: number;
  aqiCategory?: string;
  dominantPollutant?: string;
  temperature?: number;
  feelsLike?: number;
  humidity?: number;
  humidityCategory?: string;
  uvIndex?: number;
  windSpeed?: number;
  weatherDesc?: string;
  waterHardness?: string;
  pm25?: number;
  pm10?: number;
  co?: number;
  no2?: number;
  so2?: number;
  o3?: number;
  nh3?: number;
}

export interface PersonalizeMagicRequest {
  userData: {
    age?: number;
    gender?: string;
    skinType?: string;
    topConcern?: string[];
  };
  environmentData: Partial<EnvironmentData>;
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
