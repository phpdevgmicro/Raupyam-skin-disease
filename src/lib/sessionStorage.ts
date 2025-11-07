import { ConsentFormData } from "@/types/schema";

const STORAGE_KEYS = {
  PATIENT_DATA: 'skin_analysis_patient_data',
  COORDINATES: 'skin_analysis_coordinates',
  AIR_QUALITY: 'skin_analysis_air_quality',
  IMAGES: 'skin_analysis_images',
} as const;

export interface PatientSessionData extends ConsentFormData {
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface AirQualityData {
  aqi?: number;
  category?: string;
  dominantPollutant?: string;
  pollutants?: any;
  indexes?: any[];
  timestamp?: string;
}

export const sessionStorage = {
  savePatientData(data: PatientSessionData) {
    window.sessionStorage.setItem(STORAGE_KEYS.PATIENT_DATA, JSON.stringify(data));
  },

  getPatientData(): PatientSessionData | null {
    const data = window.sessionStorage.getItem(STORAGE_KEYS.PATIENT_DATA);
    return data ? JSON.parse(data) : null;
  },

  saveAirQuality(data: AirQualityData) {
    window.sessionStorage.setItem(STORAGE_KEYS.AIR_QUALITY, JSON.stringify(data));
  },

  getAirQuality(): AirQualityData | null {
    const data = window.sessionStorage.getItem(STORAGE_KEYS.AIR_QUALITY);
    return data ? JSON.parse(data) : null;
  },

  saveImages(images: string[]) {
    window.sessionStorage.setItem(STORAGE_KEYS.IMAGES, JSON.stringify(images));
  },

  getImages(): string[] {
    const data = window.sessionStorage.getItem(STORAGE_KEYS.IMAGES);
    return data ? JSON.parse(data) : [];
  },

  clearAll() {
    Object.values(STORAGE_KEYS).forEach(key => {
      window.sessionStorage.removeItem(key);
    });
  },
};
