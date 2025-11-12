import type { ConsentFormData } from "@/types/schema";
import type { AirQualityResponse, WeatherResponse } from "./googleApis";
import type { AirQualitySummary, WeatherSummary, PersonalizeMagicRequest } from "./api";

export function formatPersonalizationData(
  formData: Partial<ConsentFormData>,
  city: string,
  airQuality: AirQualityResponse | null,
  weather: WeatherResponse | null
): PersonalizeMagicRequest {
  // Extract minimal air quality data
  let airQualitySummary: AirQualitySummary | null = null;
  if (airQuality && airQuality.aqi && airQuality.category) {
    // Extract PM2.5 and PM10 from pollutants array
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
  
  return {
    userData: {
      fullName: formData.fullName,
      age: formData.age,
      gender: formData.gender,
      skinType: formData.skinType,
      topConcern: formData.topConcern,
      location: {
        city: formData.city,
        state: formData.state,
        country: formData.country,
      },
    },
    airQuality: airQualitySummary,
    weather: weatherSummary,
  };
}

