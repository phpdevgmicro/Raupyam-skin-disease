import type { ConsentFormData } from "@/types/schema";
import type { AirQualityResponse, WeatherResponse } from "./googleApis";
import type { PersonalizeMagicRequest, EnvironmentData } from "./api";

/**
 * Helper function to extract pollutant value from air quality response
 * Normalizes codes by converting to lowercase and removing dots/underscores
 */
function extractPollutantValue(
  pollutants: any[] | undefined,
  code: string
): number {
  if (!pollutants || !Array.isArray(pollutants)) {
    return 0;
  }
  
  // Normalize the search code (lowercase, remove dots and underscores)
  const normalizedCode = code.toLowerCase().replace(/[._]/g, '');
  
  const pollutant = pollutants.find((p: any) => {
    if (!p.code) return false;
    // Normalize the pollutant code the same way
    const normalizedPollutantCode = p.code.toLowerCase().replace(/[._]/g, '');
    return normalizedPollutantCode === normalizedCode;
  });
  
  return pollutant?.concentration?.value ?? 0;
}

/**
 * Helper function to categorize humidity level
 * Treats only null/undefined as missing data, 0% is valid and maps to "Low"
 */
function categorizeHumidity(humidity: number | undefined | null): string {
  // Only treat null/undefined as missing data (0 is a valid humidity value)
  if (humidity === null || humidity === undefined) return "Medium";
  
  if (humidity <= 40) return "Low";
  if (humidity <= 70) return "Medium";
  return "High";
}

/**
 * Convert markdown-style formatting to HTML
 * Replaces **text** and *text* with <strong>text</strong> and handles newlines
 */
export function convertMarkdownToHtml(text: string): string {
  if (!text) return text;
  
  // First replace **text** with <strong>text</strong> (double asterisks)
  let formatted = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Then replace remaining *text* with <strong>text</strong> (single asterisks)
  formatted = formatted.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
  
  // Replace single newlines with <br> but keep paragraph structure
  formatted = formatted.replace(/\n/g, '<br>');
  
  return formatted;
}

/**
 * Format data for personalize magic API
 * Builds payload matching backend expectations: { userData, environmentData }
 * Includes environment data when either air quality OR weather is available
 * Only includes user fields when they have valid values
 * Only includes pollutants with actual values (> 0)
 */
export function formatPersonalizationData(
  formData: Partial<ConsentFormData>,
  city: string,
  airQuality: AirQualityResponse | null,
  weather: WeatherResponse | null
): PersonalizeMagicRequest {
  // Build user data with only fields that have valid values
  const userData: any = {};
  
  // Only include age if it's a valid number greater than 0
  if (formData.age && formData.age > 0) {
    userData.age = formData.age;
  }
  
  // Always include gender if present
  if (formData.gender) {
    userData.gender = formData.gender;
  }
  
  // Only include skinType if present
  if (formData.skinType) {
    userData.skinType = formData.skinType;
  }
  
  // Only include topConcern if it's an array with at least one item
  if (formData.topConcern && Array.isArray(formData.topConcern) && formData.topConcern.length > 0) {
    userData.topConcern = formData.topConcern;
  }
  
  // Build environment data if we have at least weather OR air quality
  // Note: AQI of 0 is valid (means "Good" air quality), so check for null/undefined explicitly
  // Note: Temperature of 0 is also valid (freezing point), so check for null/undefined explicitly
  // Check for ANY weather field (temperature, humidity, uvIndex, windSpeed, weatherDesc)
  const hasWeather = !!(weather && (
    (weather.temperature && weather.temperature.value !== null && weather.temperature.value !== undefined) ||
    (weather.humidity !== null && weather.humidity !== undefined) ||
    (weather.uvIndex !== null && weather.uvIndex !== undefined) ||
    (weather.windSpeed && weather.windSpeed.value !== null && weather.windSpeed.value !== undefined) ||
    weather.weatherDesc
  ));
  const hasAirQuality = !!(airQuality && airQuality.aqi !== null && airQuality.aqi !== undefined);
  const hasValidEnvData = hasWeather || hasAirQuality;
  
  const environmentData: Partial<EnvironmentData> = {};
  
  if (hasValidEnvData && city) {
    environmentData.city = city;
    
    // Add air quality data if available
    if (hasAirQuality && airQuality) {
      environmentData.aqi = airQuality.aqi;
      environmentData.aqiCategory = airQuality.category;
      
      // Only include dominant pollutant if provided by API
      if (airQuality.dominantPollutant) {
        environmentData.dominantPollutant = airQuality.dominantPollutant;
      }
      
      // Dynamically extract ALL pollutants from the API response
      // Only include pollutants with values > 0
      if (airQuality.pollutants && Array.isArray(airQuality.pollutants)) {
        airQuality.pollutants.forEach((pollutant: any) => {
          if (pollutant.code && pollutant.concentration?.value) {
            const value = pollutant.concentration.value;
            if (value > 0) {
              // Normalize pollutant code (remove dots, underscores, lowercase)
              const normalizedCode = pollutant.code.toLowerCase().replace(/[._]/g, '');
              // Use normalized code as key in environment data
              (environmentData as any)[normalizedCode] = value;
            }
          }
        });
      }
    }
    
    // Add weather data if available
    // Only include fields that have actual values - don't default to 0 or "Clear"
    if (hasWeather && weather) {
      // Temperature
      if (weather.temperature && weather.temperature.value !== null && weather.temperature.value !== undefined) {
        environmentData.temperature = weather.temperature.value;
      }
      
      // Feels like (fallback to temperature if available)
      if (weather.feelsLike !== null && weather.feelsLike !== undefined) {
        environmentData.feelsLike = weather.feelsLike;
      } else if (weather.temperature && weather.temperature.value !== null && weather.temperature.value !== undefined) {
        environmentData.feelsLike = weather.temperature.value;
      }
      
      // Humidity and category
      if (weather.humidity !== null && weather.humidity !== undefined) {
        environmentData.humidity = weather.humidity;
        environmentData.humidityCategory = categorizeHumidity(weather.humidity);
      }
      
      // UV Index
      if (weather.uvIndex !== null && weather.uvIndex !== undefined) {
        environmentData.uvIndex = weather.uvIndex;
      }
      
      // Wind speed
      if (weather.windSpeed && weather.windSpeed.value !== null && weather.windSpeed.value !== undefined) {
        environmentData.windSpeed = weather.windSpeed.value;
      }
      
      // Weather description
      if (weather.weatherDesc) {
        environmentData.weatherDesc = weather.weatherDesc;
      }
      
      // Water hardness - omitted until real data source is available
      // TODO: Implement water hardness data lookup when available
    }
  }
  
  return {
    userData,
    environmentData,
  };
}

