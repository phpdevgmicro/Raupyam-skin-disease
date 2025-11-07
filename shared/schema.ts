import { z } from "zod";

export const consentFormSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  age: z.coerce.number().min(1, "Age is required").max(120, "Please enter a valid age"),
  gender: z.enum(["male", "female", "other", "prefer-not-to-say"], {
    required_error: "Please select a gender",
  }),
  skinType: z.enum(["oily", "dry", "combination", "sensitive", "normal"], {
    required_error: "Please select your skin type",
  }),
  address: z.string().min(5, "Please enter a valid address"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  country: z.string().min(2, "Country is required"),
});

export type ConsentFormData = z.infer<typeof consentFormSchema>;

export const feedbackFormSchema = z.object({
  suggestion: z.string().min(10, "Please provide at least 10 characters of feedback"),
  email: z.string().email("Please enter a valid email address"),
});

export type FeedbackFormData = z.infer<typeof feedbackFormSchema>;

export interface AnalysisRequest {
  consentData: ConsentFormData;
  images: string[];
}

export interface AnalysisResponse {
  analysis: string;
  recommendations: string[];
  severity: "mild" | "moderate" | "severe";
}

export interface User {
  id: string;
  username: string;
  password: string;
}

export type InsertUser = Omit<User, "id">;
