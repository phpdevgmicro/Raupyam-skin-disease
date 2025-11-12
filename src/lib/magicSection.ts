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
 * Only includes environment data if we have valid air quality and weather data
 * Only includes user fields when they have valid values
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
  
  // Only build environment data if we have real data (not null/undefined)
  const hasValidEnvData = !!(airQuality && weather && city);
  
  const environmentData: Partial<EnvironmentData> = hasValidEnvData ? {
    city: city,
    aqi: airQuality.aqi,
    aqiCategory: airQuality.category,
    dominantPollutant: airQuality.dominantPollutant ?? "Unknown",
    temperature: weather.temperature?.value ?? 0,
    feelsLike: weather.feelsLike ?? weather.temperature?.value ?? 0,
    humidity: weather.humidity ?? 0,
    humidityCategory: categorizeHumidity(weather.humidity),
    uvIndex: weather.uvIndex ?? 0,
    windSpeed: weather.windSpeed?.value ?? 0,
    weatherDesc: weather.weatherDesc ?? "Clear",
    waterHardness: "Medium minerals", // Placeholder - can be enhanced later
    // Extract all 6 pollutants
    pm25: extractPollutantValue(airQuality.pollutants, "pm25"),
    pm10: extractPollutantValue(airQuality.pollutants, "pm10"),
    co: extractPollutantValue(airQuality.pollutants, "co"),
    no2: extractPollutantValue(airQuality.pollutants, "no2"),
    so2: extractPollutantValue(airQuality.pollutants, "so2"),
    o3: extractPollutantValue(airQuality.pollutants, "o3"),
  } : {};
  
  return {
    userData,
    environmentData,
  };
}

