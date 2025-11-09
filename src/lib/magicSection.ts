import type { ConsentFormData } from "@/types/schema";
import type { AirQualityResponse, WeatherResponse } from "./googleApis";

export interface PersonalizationData {
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
    humidity?: number;
    uvIndex?: number;
    temperature?: number;
  };
}

export function formatPersonalizationData(
  formData: Partial<ConsentFormData>,
  city: string,
  airQuality: AirQualityResponse | null,
  weather: WeatherResponse | null
): PersonalizationData {
  return {
    userData: {
      age: formData.age,
      gender: formData.gender,
      skinType: formData.skinType,
      topConcern: formData.topConcern,
    },
    environmentData: {
      city,
      aqi: airQuality?.aqi,
      aqiCategory: airQuality?.category,
      humidity: weather?.humidity,
      uvIndex: weather?.uvIndex,
      temperature: weather?.temperature?.value,
    },
  };
}

/**
 * Generates personalized magic text with smart conditional logic
 * TODO: In production, this should call a PHP backend endpoint that uses OpenAI
 * Endpoint: POST /route.php?type=personalize-magic
 * Request body: PersonalizationData
 * Response: { personalizedText: string }
 */
export function generatePersonalizedMagicText(data: PersonalizationData): string {
  const city = data.environmentData.city;
  const aqi = data.environmentData.aqi;
  const aqiCategory = data.environmentData.aqiCategory;
  const humidity = data.environmentData.humidity;
  const uvIndex = data.environmentData.uvIndex;
  const age = data.userData.age;
  const skinType = data.userData.skinType;
  const concerns = data.userData.topConcern || [];

  // Air Quality Section
  let aqiText = "";
  if (aqi !== undefined) {
    if (aqi > 100) {
      aqiText = `**Air Quality (AQI/PM2.5)**: Heavy pollution in **${city}**? Your skin needs serious antioxidant armor—think liposome vitamin C and ferulic acid combos that sink deep without the heaviness.`;
    } else if (aqi > 50) {
      aqiText = `**Air Quality (AQI/PM2.5)**: Moderate haze in **${city}**? Antioxidant armor (think liposome vitamin C—sips in protection without the weight).`;
    } else {
      aqiText = `**Air Quality (AQI/PM2.5)**: Fresh air in **${city}**! Lucky you—we'll still add light antioxidants for everyday protection.`;
    }
  }

  // UV & Humidity Section
  let climateText = "";
  if (humidity !== undefined && uvIndex !== undefined) {
    if (humidity > 70 && uvIndex > 6) {
      climateText = "**UV & Humidity**: High rays in sticky air? Lightweight SPF 50+ with a matte finish—protection without the slick.";
    } else if (humidity > 70) {
      climateText = "**UV & Humidity**: High humidity? Gel-based formulas that won't feel heavy—breathable protection that works with your climate.";
    } else if (humidity < 40) {
      climateText = "**UV & Humidity**: Dry air? Rich creams with ceramides to lock in moisture and keep your barrier strong.";
    } else {
      climateText = "**UV & Humidity**: Balanced climate? Versatile formulas that adapt—neither too rich nor too light.";
    }
  } else if (humidity !== undefined) {
    climateText = humidity > 70 
      ? "**Humidity**: Sticky air? Lighter gels that won't add to the weight." 
      : "**Humidity**: Low humidity? Richer creams to lock in every drop of moisture.";
  }

  // Personalized Example
  let exampleText = "";
  if (age && skinType) {
    const ageGroup = age < 25 ? "early 20s" : age < 35 ? "30s" : age < 45 ? "40s" : "mature";
    const skinTypeAdj = skinType === 'oily' ? 'oil-control' : 
                       skinType === 'dry' ? 'hydration-boost' : 
                       skinType === 'sensitive' ? 'calming' : 
                       'balanced';
    
    const concernText = concerns.length > 0 
      ? concerns.includes('acne') ? 'fighting breakouts' :
        concerns.includes('fine-lines') ? 'smoothing fine lines' :
        concerns.includes('redness') ? 'calming redness' :
        concerns.includes('dullness') ? 'boosting radiance' : 'all-around glow'
      : 'healthy skin';

    const cityClimate = humidity && humidity > 70 ? `humid ${city}` : 
                       humidity && humidity < 40 ? `dry ${city}` : city;

    if (skinType === 'combination') {
      exampleText = `(E.g., ${age}yo combination type in ${cityClimate}? Peptide emulsion with humectant layers—balanced, dewy by week 3.)`;
    } else if (skinType === 'oily' && aqi && aqi > 50) {
      exampleText = `(E.g., ${age}yo with oily skin in polluted ${city}? Niacinamide serum + lightweight antioxidants—${concernText}, matte finish by week 2.)`;
    } else if (skinType === 'dry') {
      exampleText = `(E.g., ${age}yo with dry skin in ${city}? Hyaluronic acid + ceramide cream—plump, hydrated glow by week 2.)`;
    } else if (skinType === 'sensitive') {
      exampleText = `(E.g., ${age}yo sensitive skin in ${city}? Centella + niacinamide—calm, soothed, ${concernText} by week 3.)`;
    } else {
      exampleText = `(E.g., ${age}yo ${skinType} skin in ${city}? ${skinTypeAdj.charAt(0).toUpperCase() + skinTypeAdj.slice(1)} formulas tailored to your ${ageGroup} routine—${concernText}, visible results by week 2-3.)`;
    }
  }

  return `**Your World's Whisper to Your Skin: How We Craft Smarter**

We don't guess—we *get* your backdrop. Pulling live deets like:

- ${aqiText}
- **Water Quality**: High minerals? Soothing hyaluronics to melt away that parched pull.
- ${climateText}

Blend with your age/gender/skin intel = your no-BS recipe. ${exampleText}`;
}
