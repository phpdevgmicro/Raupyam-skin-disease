import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { consentFormSchema, type ConsentFormData } from "@/types/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { MapPin, Loader2, Info, Droplets, Wind, Heart, Zap, Sun, Cloud, ArrowRight, CheckCircle2, Lock, X, Sparkles } from "lucide-react";
import { BulletIcon } from "@/components/BulletIcon";
import { fetchEnvironmentalData, detectLocationFromIP, type Coordinates, type AirQualityResponse, type WeatherResponse } from "@/lib/googleApis";
import { sessionStorage } from "@/lib/sessionStorage";
import { useToast } from "@/hooks/use-toast";
import { formatPersonalizationData } from "@/lib/magicSection";
import { getPersonalizedMagicText } from "@/lib/api";

interface ConsentFormProps {
  onSubmit: (data: ConsentFormData) => void;
  initialData?: ConsentFormData | null;
}

export default function ConsentForm({ onSubmit, initialData }: ConsentFormProps) {
  const cityInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [citySelected, setCitySelected] = useState(!!initialData?.cityName);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(
    (initialData as any)?.coordinates || null
  );
  const [lastSubmittedCity, setLastSubmittedCity] = useState<string>(
    initialData?.cityName || ""
  );
  const [lastGeocodedCity, setLastGeocodedCity] = useState<string>(
    initialData?.cityName || ""
  );
  const [environmentalData, setEnvironmentalData] = useState<{
    airQuality: AirQualityResponse | null;
    weather: WeatherResponse | null;
    city: string;
  } | null>(null);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const [personalizedMagicText, setPersonalizedMagicText] = useState<string | null>(null);
  const [isLoadingMagicText, setIsLoadingMagicText] = useState(false);
  const [cachedProfileHash, setCachedProfileHash] = useState<string | null>(null);
  const [accordionOpen, setAccordionOpen] = useState<string>("");
  const [isManuallyOpened, setIsManuallyOpened] = useState(false);
  const [retryRequested, setRetryRequested] = useState(false);
  const requestTokenRef = useRef(0);
  const lastFetchedHashRef = useRef<string | null>(null);
  const { toast } = useToast();

  const form = useForm<ConsentFormData>({
    resolver: zodResolver(consentFormSchema),
    defaultValues: initialData || {
      fullName: "",
      age: 0,
      gender: undefined,
      skinType: undefined,
      topConcern: [],
      cityName: "",
      city: "",
      state: "",
      country: "",
    },
  });

  // Watch form values for completion validation
  const age = form.watch("age");
  const gender = form.watch("gender");
  const skinType = form.watch("skinType");
  const topConcern = form.watch("topConcern");

  // Watch location fields for manual entry
  const city = form.watch("city");
  const cityName = form.watch("cityName");

  // Get effective location - prefer manual entry over auto-detected data
  const effectiveLocation = useMemo(() => {
    // If user has selected a city via autocomplete, use cityName
    if (cityName && cityName.trim()) {
      return cityName.trim();
    }
    // Otherwise use city field if available
    if (city && city.trim()) {
      return city.trim();
    }
    // Otherwise use environmental data city if available
    if (environmentalData?.city) {
      return environmentalData.city;
    }
    return null;
  }, [cityName, city, environmentalData?.city]);

  // Check if environmental data is ready for personalization
  const isPersonalizationReady = useMemo(() => {
    return !!(effectiveLocation && environmentalData);
  }, [effectiveLocation, environmentalData]);

  // Check if user has added profile enhancements
  const hasProfileData = useMemo(() => {
    return !!(age > 0 || gender || skinType || (topConcern && topConcern.length > 0));
  }, [age, gender, skinType, topConcern]);

  // Generate hash of current profile for caching
  const generateProfileHash = useCallback(() => {
    return JSON.stringify({
      age,
      gender,
      skinType,
      topConcern: topConcern ? [...topConcern].sort() : [],
      // Use effective location (prioritizes manual over auto-detect)
      locationCity: effectiveLocation,
      // Only include environmental data if it matches effective location
      aqi: (effectiveLocation === environmentalData?.city) ? environmentalData?.airQuality?.aqi : null,
      aqiCategory: (effectiveLocation === environmentalData?.city) ? environmentalData?.airQuality?.category : null,
      humidity: (effectiveLocation === environmentalData?.city) ? environmentalData?.weather?.humidity : null,
      temperature: (effectiveLocation === environmentalData?.city) ? environmentalData?.weather?.temperature : null,
      uvIndex: (effectiveLocation === environmentalData?.city) ? environmentalData?.weather?.uvIndex : null,
    });
  }, [age, gender, skinType, topConcern, effectiveLocation, environmentalData]);

  // Auto-close accordion when profile changes (fixes timing issues with controlled Radix component)
  useEffect(() => {
    const currentHash = generateProfileHash();

    // If profile hash changed and we have cached data, reset personalization state
    if (cachedProfileHash && cachedProfileHash !== currentHash) {
      setPersonalizedMagicText(null);
      setCachedProfileHash(null);
      setAccordionOpen("");
      setIsManuallyOpened(false);
    }
  }, [age, gender, skinType, topConcern, effectiveLocation, environmentalData, generateProfileHash, cachedProfileHash]);

  // Centralized handler for form field changes - clears cached data and closes accordion
  const handleFormFieldChange = useCallback(() => {
    // Always clear cached personalization when fields change
    setPersonalizedMagicText(null);
    setCachedProfileHash(null);

    // Reset lastFetchedHashRef to allow new fetches for the updated profile
    lastFetchedHashRef.current = null;

    // Always close accordion when any field is filled so user reopens to fetch fresh data
    setAccordionOpen("");
    setIsManuallyOpened(false);
  }, []);

  // Extracted fetch logic for personalization
  const fetchMagicText = useCallback(async () => {
    const currentHash = generateProfileHash();

    // Skip if we already have cached result for this exact profile
    if (cachedProfileHash === currentHash && personalizedMagicText) {
      return;
    }

    // Set lastFetchedHashRef before making the API call to prevent retry loops
    lastFetchedHashRef.current = currentHash;

    // Clear retryRequested when starting a fetch
    setRetryRequested(false);

    // Increment request token to invalidate any in-flight requests
    const thisRequestToken = ++requestTokenRef.current;

    setIsLoadingMagicText(true);

    try {
      // Get all current form values
      const formValues = form.getValues();

      // Send complete raw data without filtering - backend will handle everything
      const personalizationData = formatPersonalizationData(
        formValues,
        effectiveLocation || "your area",
        environmentalData?.airQuality || null,
        environmentalData?.weather || null
      );

      const response = await getPersonalizedMagicText(personalizationData);

      // Ignore response if a newer request has been made
      if (thisRequestToken !== requestTokenRef.current) {
        return;
      }

      if (response.personalizedText) {
        setPersonalizedMagicText(response.personalizedText);
        setCachedProfileHash(currentHash);
      } else if (response.error) {
        console.error('Failed to get personalized text:', response.error);
        setPersonalizedMagicText(null);
        toast({
          title: "Couldn't load personalized magic",
          description: "Please try again in a moment.",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error fetching personalized text:', error);

      // Ignore errors from stale requests
      if (thisRequestToken !== requestTokenRef.current) {
        return;
      }

      setPersonalizedMagicText(null);
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      // Only clear loading flag if this is still the current request
      if (thisRequestToken === requestTokenRef.current) {
        setIsLoadingMagicText(false);
      }
    }
  }, [generateProfileHash, cachedProfileHash, personalizedMagicText, effectiveLocation, environmentalData, form, toast]);

  // Handle accordion toggle - fetch personalized magic when opened
  const handleAccordionChange = async (value: string | undefined) => {
    setAccordionOpen(value || "");

    // Track if user manually opened the accordion
    if (value === "behind-scenes") {
      setIsManuallyOpened(true);
    } else {
      setIsManuallyOpened(false);
    }

    // Only fetch when accordion opens and profile is ready
    if (value === "behind-scenes" && isPersonalizationReady) {
      fetchMagicText();
    }
  };

  // Auto-refetch when accordion is open and profile data changes
  useEffect(() => {
    const currentHash = generateProfileHash();
    
    // Only fetch if profile hash has changed from last attempt OR retry is explicitly requested
    const shouldFetch = 
      accordionOpen === "behind-scenes" &&
      isPersonalizationReady &&
      !personalizedMagicText &&
      !isLoadingMagicText &&  // Prevent duplicate requests while one is in flight
      (lastFetchedHashRef.current !== currentHash || retryRequested);  // NEW: Only run when hash changed OR retry requested
    
    if (shouldFetch) {
      // Debounce to avoid excessive requests during rapid edits
      const timeoutId = setTimeout(() => {
        fetchMagicText();
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [accordionOpen, isPersonalizationReady, personalizedMagicText, isLoadingMagicText, retryRequested, generateProfileHash, fetchMagicText]);

  useEffect(() => {
    if (cityInputRef.current && window.google?.maps?.places) {
      autocompleteRef.current = new google.maps.places.Autocomplete(
        cityInputRef.current,
        {
          types: ["(cities)"],
        }
      );

      autocompleteRef.current.addListener("place_changed", async () => {
        const place = autocompleteRef.current?.getPlace();
        if (place?.formatted_address) {
          let cityName = "";
          let city = "";
          let state = "";
          let country = "";
          let countryCode = "";

          place.address_components?.forEach((component: google.maps.places.AddressComponent) => {
            const types = component.types;
            if (types.includes("locality")) {
              city = component.long_name;
              cityName = component.long_name;
            }
            if (types.includes("administrative_area_level_1")) {
              state = component.long_name;
            }
            if (types.includes("country")) {
              country = component.long_name;
              countryCode = component.short_name;
            }
          });

          form.setValue("cityName", cityName, { shouldValidate: true });
          form.setValue("city", city || cityName, { shouldValidate: true });
          form.setValue("state", state, { shouldValidate: true });
          form.setValue("country", country, { shouldValidate: true });

          // Validate that required fields are present
          if (!cityName || !state || !country) {
            // Clear the fields if incomplete
            form.setValue("cityName", "", { shouldValidate: false });
            form.setValue("city", "", { shouldValidate: false });
            form.setValue("state", "", { shouldValidate: false });
            form.setValue("country", "", { shouldValidate: false });
            setCitySelected(false);

            toast({
              title: "Incomplete Location",
              description: "The selected city is missing some required details (state or country). Please try selecting a different city from the suggestions.",
              variant: "destructive",
              duration: 6000,
            });
            return;
          }

          // Reset magic section when location changes
          handleFormFieldChange();

          if ((place as any).geometry?.location) {
            const coords = {
              lat: (place as any).geometry.location.lat(),
              lng: (place as any).geometry.location.lng(),
            };
            setCoordinates(coords);

            // Only fetch environmental data if city actually changed
            if (cityName !== lastGeocodedCity) {
              setLastGeocodedCity(cityName);

              const envData = await fetchEnvironmentalData(coords);
              setEnvironmentalData({
                airQuality: envData.airQuality,
                weather: envData.weather,
                city: cityName,
              });
            }
          }

          setCitySelected(true);
        }
      });
    }
  }, [form]);

  useEffect(() => {
    async function autoDetectLocation() {
      if (initialData?.city) {
        return;
      }

      const savedAutoLocation = sessionStorage.getAutoLocation();

      if (savedAutoLocation) {
        form.setValue("cityName", savedAutoLocation.city, { shouldValidate: false });
        form.setValue("city", savedAutoLocation.city, { shouldValidate: false });
        form.setValue("state", savedAutoLocation.state, { shouldValidate: false });
        form.setValue("country", savedAutoLocation.country, { shouldValidate: false });
        setCoordinates(savedAutoLocation.coordinates);
        setCitySelected(true);
        setEnvironmentalData({
          airQuality: savedAutoLocation.airQuality,
          weather: savedAutoLocation.weather,
          city: savedAutoLocation.city,
        });
        return;
      }

      setIsAutoDetecting(true);

      try {
        const location = await detectLocationFromIP();

        if (location) {
          const coords = {
            lat: location.latitude,
            lng: location.longitude,
          };

          const envData = await fetchEnvironmentalData(coords);

          const autoLocationData = {
            city: location.city,
            state: location.region,
            country: location.country,
            coordinates: coords,
            airQuality: envData.airQuality,
            weather: envData.weather,
            detectedAt: new Date().toISOString(),
          };

          sessionStorage.saveAutoLocation(autoLocationData);

          form.setValue("cityName", location.city, { shouldValidate: false });
          form.setValue("city", location.city, { shouldValidate: false });
          form.setValue("state", location.region, { shouldValidate: false });
          form.setValue("country", location.country, { shouldValidate: false });
          setCoordinates(coords);
          setCitySelected(true);
          setEnvironmentalData({
            airQuality: envData.airQuality,
            weather: envData.weather,
            city: location.city,
          });
        }
      } catch (error) {
        console.error('Auto-detection failed:', error);
      } finally {
        setIsAutoDetecting(false);
      }
    }

    autoDetectLocation();
  }, [form, initialData]);

  const handleFormSubmit = async (data: ConsentFormData) => {
    // Validate that location fields are not empty
    if (!data.cityName || !data.city || !data.state || !data.country) {
      form.setError("cityName", {
        type: "manual",
        message: "Please select a city from the dropdown"
      });
      form.setError("city", {
        type: "manual",
        message: "City is required"
      });
      toast({
        title: "Incomplete Location",
        description: "Please select a city from the dropdown. Start typing your city name and choose from the suggestions.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const patientData = coordinates ? { ...data, coordinates } : data;

      sessionStorage.savePatientData(patientData);

      // Only save environmental data if we already have it (from auto-detection or address selection)
      // Don't make new API calls on form submit - those should only happen when address is manually selected
      if (environmentalData?.airQuality) {
        sessionStorage.saveAirQuality({
          ...environmentalData.airQuality,
          timestamp: new Date().toISOString(),
        });
      }
      if (environmentalData?.weather) {
        sessionStorage.saveWeather({
          ...environmentalData.weather,
          timestamp: new Date().toISOString(),
        });
      }

      if (!coordinates && data.cityName !== lastSubmittedCity) {
        toast({
          title: "Location not found",
          description: "We couldn't get coordinates for your city, but you can still proceed.",
          duration: 5000,
        });
      }

      setLastSubmittedCity(data.cityName);
      onSubmit(patientData as ConsentFormData);
    } catch (error) {
      console.error('Form submission error:', error);

      const errorMessage = error instanceof Error
        ? error.message
        : "There was an error processing your information. Please try again.";

      toast({
        title: "Error",
        description: errorMessage.includes('storage') || errorMessage.includes('quota')
          ? "Failed to save your information. Please check your browser storage settings and try again."
          : errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-[#f8f8f8] dark:bg-gray-900/50 shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl md:text-3xl font-bold">Your Skin Story Starter</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">What's the name behind that glow? 👋</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Alex Rivera"
                        data-testid="input-fullname"
                        autoComplete="off"
                        className="min-h-11 text-base mt-15 placeholder:opacity-100 focus:placeholder:opacity-0"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleFormFieldChange();
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-base font-semibold">
                      How many trips around the sun? (Age)
                      <span onClick={(e) => e.preventDefault()}>
                        <Tooltip delayDuration={0}>
                          <TooltipTrigger asChild>
                            <Info className="w-5 h-5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="px-4 py-3 text-base leading-relaxed max-w-sm">
                            <p className="tool-tip-info">This lets us tweak for your vibe—antioxidants for 20s pollution fighters, peptides for 40+ firmness.</p>
                          </TooltipContent>
                        </Tooltip>
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="24"
                        data-testid="input-age"
                        autoComplete="off"
                        className="min-h-11 text-base placeholder:opacity-100 focus:placeholder:opacity-0"
                        {...field}
                        value={field.value || ""}
                        onFocus={() => {
                          if (field.value === 0) {
                            form.setValue("age", "" as any);
                          }
                        }}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "") {
                            form.setValue("age", "" as any);
                          } else {
                            const numValue = parseInt(value, 10);
                            if (!isNaN(numValue)) {
                              field.onChange(numValue);
                            }
                          }
                          handleFormFieldChange();
                        }}
                        onBlur={(e) => {
                          const value = e.target.value;
                          if (value === "" || value === "0") {
                            form.setValue("age", 0);
                          } else {
                            const numValue = parseInt(value, 10);
                            if (!isNaN(numValue)) {
                              field.onChange(numValue);
                            }
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-base font-semibold">
                    What's your vibe? Gender?
                    <span onClick={(e) => e.preventDefault()}>
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <Info className="w-5 h-5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="px-4 py-3 text-base leading-relaxed max-w-sm">
                          <p className="tool-tip-info">Hormones play a role—e.g., oil control for testosterone-driven 20s guys, hydration heroes for estrogen dips in women.</p>
                        </TooltipContent>
                      </Tooltip>
                    </span>
                  </FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleFormFieldChange();
                    }}
                    defaultValue={field.value}
                    data-testid="select-gender"
                  >
                    <FormControl>
                      <SelectTrigger className="min-h-11 text-base">
                        <SelectValue placeholder="Select your vibe" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="non-binary">Non-Binary</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer Not to Say</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="skinType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-base font-semibold">
                    Your skin's mood today? (Flaky rebel or oily adventurer?) 🧴
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <Info className="w-5 h-5 text-muted-foreground cursor-help big-width" />
                      </TooltipTrigger>
                      <TooltipContent className="px-4 py-3 text-base leading-relaxed max-w-sm">
                        <p className="tool-tip-info">This fine-tunes emulsions—e.g., lightweight gels for oily types in humid climate.</p>
                      </TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-3">
                      {[
                        { value: 'oily', label: 'Oily', icon: Droplets },
                        { value: 'dry', label: 'Dry', icon: Wind },
                        { value: 'combination', label: 'Combo', icon: Sparkles },
                        { value: 'sensitive', label: 'Sensitive', icon: Heart },
                        { value: 'normal', label: 'Normal', icon: Zap },
                      ].map((type) => {
                        const Icon = type.icon;
                        const isSelected = field.value === type.value;

                        return (
                          <Button
                            key={type.value}
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            className="min-h-[60px] sm:min-h-[80px] flex flex-col items-center justify-center gap-1 sm:gap-2 px-1 sm:px-2 py-2 sm:py-3"
                            onClick={() => {
                              field.onChange(type.value);
                              handleFormFieldChange();
                            }}
                            data-testid={`button-skintype-${type.value}`}
                          >
                            <Icon className="w-4 h-4 sm:w-6 sm:h-6" />
                            <span className="text-xs sm:text-sm">{type.label}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="topConcern"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-base font-semibold">
                    What's bugging your glow most? (Pick 1-2—we've got fixes.) 🔥
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <Info className="w-5 h-5 text-muted-foreground cursor-help big-width" />
                      </TooltipTrigger>
                      <TooltipContent className="px-4 py-3 text-base leading-relaxed max-w-sm">
                        <p className="tool-tip-info">Zeroes in on heroes like bakuchiol for lines or niacinamide for redness, synced to your water quality.</p>
                      </TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      {(['acne', 'fine-lines', 'dullness', 'redness', 'other'] as const).map((concern) => {
                        const isSelected = field.value?.includes(concern);
                        const isDisabled = !isSelected && (field.value?.length ?? 0) >= 2;
                        const concernLabels = {
                          'acne': 'Acne',
                          'fine-lines': 'Fine Lines',
                          'dullness': 'Dullness',
                          'redness': 'Redness',
                          'other': 'Other'
                        };

                        return (
                          <Button
                            key={concern}
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            size="lg"
                            className="rounded-full min-h-9 sm:min-h-11 px-4 sm:px-6 text-sm sm:text-base"
                            disabled={isDisabled}
                            onClick={() => {
                              const currentValues = field.value || [];
                              if (isSelected) {
                                field.onChange(currentValues.filter((v: string) => v !== concern));
                              } else if (currentValues.length < 2) {
                                field.onChange([...currentValues, concern]);
                              }
                              handleFormFieldChange();
                            }}
                            data-testid={`badge-concern-${concern}`}
                          >
                            {concernLabels[concern]}
                          </Button>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Country *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Auto-filled from city"
                        data-testid="input-country"
                        autoComplete="off"
                        {...field}
                        readOnly
                        className="min-h-11 text-base bg-muted/30"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">State *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Auto-filled from city"
                        data-testid="input-state"
                        autoComplete="off"
                        {...field}
                        readOnly
                        className="min-h-11 text-base bg-muted/30"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="cityName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-base font-semibold">
                    <MapPin className="w-4 h-4" />
                    City *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Start typing your city..."
                      data-testid="input-city-name"
                      autoComplete="off"
                      className="min-h-11 text-base placeholder:opacity-100 focus:placeholder:opacity-0"
                      {...field}
                      ref={cityInputRef}
                      onChange={(e) => {
                        field.onChange(e);
                        handleFormFieldChange();
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Auto-detected Location Message */}
            {environmentalData && environmentalData.city && (
              <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-[.12rem] flex-shrink-0" />
                  <p className="text-sm text-customText line-height-less">
                    <span className="font-semibold">We grabbed {environmentalData.city}</span>
                    {environmentalData.airQuality?.aqi !== undefined && environmentalData.airQuality?.aqi !== null && (
                      <>
                        —its AQI{' '}
                        <span className="font-semibold">{environmentalData.airQuality.aqi}</span>
                        {environmentalData.airQuality.category && (
                          <span> ({environmentalData.airQuality.category})</span>
                        )}
                        {' '}means extra anti-pollution shields in your mix.
                      </>
                    )}
                    {environmentalData.weather?.humidity !== undefined && environmentalData.weather?.humidity !== null && (
                      <>
                        {' '}
                        {environmentalData.weather.humidity > 70
                          ? "We'll soften formulas to avoid that tight feeling."
                          : "Humidity here? We'll balance your routine perfectly."}
                      </>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Behind the Scenes Accordion - Magic Section */}
            {effectiveLocation && (
              <div className="mt-6">
                <Accordion type="single" collapsible className="w-full" value={accordionOpen} onValueChange={handleAccordionChange}>
                  <AccordionItem value="behind-scenes" className="border-none">
                    <AccordionTrigger className="text-lg md:text-xl hover:no-underline text-customText px-0 items-center">
                      <div className="flex items-center justify-between gap-2 flex-1 text-left">
                        <div className="text-[1.1rem] text-left">
                          <span className="font-semibold">Behind the Scenes:</span>
                          <span className="font-normal block md:inline md:ml-1">How We Make Magic for {effectiveLocation}</span>
                        </div>                        
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-base text-customText/90 space-y-5 pt-3">
                      {isLoadingMagicText ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-5">
                          <div className="relative flex items-center justify-center">
                            <Loader2 className="w-12 h-12 animate-spin text-primary" />
                          </div>
                          <p className="text-base md:text-lg text-customText/70 animate-pulse text-center">
                            Fetching fresh data for {effectiveLocation}...
                          </p>
                        </div>
                      ) : personalizedMagicText ? (
                        <div 
                          className="max-w-none animate-in fade-in duration-500 pl-0 text-left prose prose-sm md:prose-base dark:prose-invert max-w-full" 
                          style={{ fontFamily: 'var(--font-body)' }}
                          dangerouslySetInnerHTML={{ __html: personalizedMagicText }}
                        />
                      ) : (
                        <p className="text-base text-customText/70 text-center py-6">
                          Something went wrong. Please try again.
                        </p>
                      )}    
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}
          </form>
        </Form>
      </CardContent>

      <div className="px-6 pb-6 space-y-4 mb-2">
        <Button
          type="submit"
          onClick={form.handleSubmit(handleFormSubmit)}
          size="lg"
          className="w-full px-8 min-h-12 md:h-14 group shadow-lg hover:shadow-xl transition-shadow duration-300 text-[16px] md:text-[18px]"
          data-testid="button-submit-consent"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Reveal My World-Ready Routine
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Button>

        {/* Fun Fact Footer */}
        <div className="text-left text-sm text-muted-foreground italic">
          <span className="flex mt-5 line-height-less">           
            Fun fact: 92% of globe-trotters like you unlocked brighter vibes in 2 weeks. Your move? (Data's vaulted—promise.)
          </span>
        </div>
      </div>
    </Card>
  );
}
