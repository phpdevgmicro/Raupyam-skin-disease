const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface AirQualityResponse {
  aqi?: number;
  category?: string;
  pollutants?: any;
  dominantPollutant?: string;
  indexes?: any[];
}

export interface WeatherResponse {
  temperature?: {
    value: number;
    unit: string;
  };
  humidity?: number;
  windSpeed?: {
    value: number;
    unit: string;
  };
  condition?: string;
  uvIndex?: number;
}

export async function fetchAirQuality(coordinates: Coordinates): Promise<AirQualityResponse | null> {
  try {
    const response = await fetch(
      'https://airquality.googleapis.com/v1/currentConditions:lookup?key=' + GOOGLE_API_KEY,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          universalAqi: true,
          location: {
            latitude: coordinates.lat,
            longitude: coordinates.lng,
          },
          extraComputations: [
            'DOMINANT_POLLUTANT_CONCENTRATION',
            'POLLUTANT_CONCENTRATION',
            'LOCAL_AQI'
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Air quality request failed');
    }

    const data = await response.json();

    if (data.indexes && data.indexes.length > 0) {
      const universalAqi = data.indexes.find((index: any) => index.code === 'uaqi');
      
      return {
        aqi: universalAqi?.aqi || data.indexes[0]?.aqi,
        category: universalAqi?.category || data.indexes[0]?.category,
        dominantPollutant: universalAqi?.dominantPollutant || data.indexes[0]?.dominantPollutant,
        pollutants: data.pollutants,
        indexes: data.indexes,
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching air quality:', error);
    return null;
  }
}

export async function fetchWeather(coordinates: Coordinates): Promise<WeatherResponse | null> {
  try {
    const response = await fetch(
      `https://weather.googleapis.com/v1/currentConditions:lookup?key=${GOOGLE_API_KEY}&location.latitude=${coordinates.lat}&location.longitude=${coordinates.lng}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Weather request failed');
    }

    const data = await response.json();
    
    return {
      temperature: data.temperature,
      humidity: data.humidity,
      windSpeed: data.windSpeed,
      condition: data.condition,
      uvIndex: data.uvIndex,
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
}

export async function fetchAirQualityInBackground(coordinates: Coordinates, onSuccess?: (data: AirQualityResponse) => void) {
  try {
    const airQualityData = await fetchAirQuality(coordinates);
    if (airQualityData && onSuccess) {
      onSuccess(airQualityData);
    }
  } catch (error) {
    console.error('Background air quality fetch failed:', error);
  }
}

export async function fetchEnvironmentalData(coordinates: Coordinates): Promise<{
  airQuality: AirQualityResponse | null;
  weather: WeatherResponse | null;
}> {
  try {
    const [airQuality, weather] = await Promise.all([
      fetchAirQuality(coordinates),
      fetchWeather(coordinates),
    ]);

    return {
      airQuality,
      weather,
    };
  } catch (error) {
    console.error('Error fetching environmental data:', error);
    return {
      airQuality: null,
      weather: null,
    };
  }
}
