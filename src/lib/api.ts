import { sessionStorage, PatientSessionData, AirQualityData } from './sessionStorage';

function formatAirQualityForAI(airQuality: AirQualityData): string {
  let result = '';
  
  if (airQuality.indexes && Array.isArray(airQuality.indexes) && airQuality.indexes.length > 0) {
    result += 'Air Quality Indexes:\n';
    airQuality.indexes.forEach((index: any) => {
      result += `- ${index.displayName}: ${index.aqi} (${index.category})`;
      if (index.dominantPollutant) {
        result += ` - Dominant Pollutant: ${index.dominantPollutant.toUpperCase()}`;
      }
      result += '\n';
    });
  } else {
    result += `Air Quality Index (AQI): ${airQuality.aqi || 'Unknown'}\n`;
    result += `Category: ${airQuality.category || 'Unknown'}\n`;
    result += `Dominant Pollutant: ${airQuality.dominantPollutant || 'Unknown'}\n`;
  }
  
  if (airQuality.pollutants && Array.isArray(airQuality.pollutants) && airQuality.pollutants.length > 0) {
    result += '\nPollutant Concentrations:\n';
    airQuality.pollutants.forEach((pollutant: any) => {
      const value = pollutant.concentration?.value;
      const units = pollutant.concentration?.units;
      if (value !== undefined) {
        const unitsDisplay = units === 'PARTS_PER_BILLION' ? 'ppb' : 
                            units === 'MICROGRAMS_PER_CUBIC_METER' ? 'µg/m³' : units;
        result += `- ${pollutant.displayName} (${pollutant.fullName}): ${value} ${unitsDisplay}\n`;
      }
    });
  }
  
  return result.trim();
}

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

  if (!patientData) {
    throw new Error('Patient data not found in session. Please start from the beginning.');
  }

  if (images.length === 0) {
    throw new Error('No images provided');
  }

  const image = images[0];

  const formData = new FormData();
  formData.append('image', image);
  formData.append('user_detail', JSON.stringify(patientData));
  
  if (airQuality && airQuality.aqi) {
    const airQualityString = formatAirQualityForAI(airQuality);
    formData.append('air_quality', airQualityString);
  } else {
    formData.append('air_quality', 'Air quality data not available');
  }

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

export interface PersonalizeMagicRequest {
  userData: {
    age?: number;
    gender?: string;
    skinType?: string;
    topConcern?: string[];
  };
  environmentData: {
    city: string;
    aqi?: number;
    aqiCategory?: string;
    dominantPollutant?: string;
    humidity?: number;
    uvIndex?: number;
    temperature?: number;
    weatherDesc?: string;
    pm25?: number;
    pm10?: number;
    no2?: number;
    o3?: number;
    so2?: number;
    co?: number;
    windSpeed?: number;
    cloudCover?: number;
    visibility?: number;
  };
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
