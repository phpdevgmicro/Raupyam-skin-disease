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
import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2, Info, Droplets, Wind, Sparkles, Heart, Zap, Sun, Cloud, ArrowRight } from "lucide-react";
import { fetchEnvironmentalData, type Coordinates, type AirQualityResponse, type WeatherResponse } from "@/lib/googleApis";
import { sessionStorage } from "@/lib/sessionStorage";
import { useToast } from "@/hooks/use-toast";

interface ConsentFormProps {
  onSubmit: (data: ConsentFormData) => void;
  initialData?: ConsentFormData | null;
}

export default function ConsentForm({ onSubmit, initialData }: ConsentFormProps) {
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addressSelected, setAddressSelected] = useState(!!initialData?.address);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(
    (initialData as any)?.coordinates || null
  );
  const [lastSubmittedAddress, setLastSubmittedAddress] = useState<string>(
    initialData?.address || ""
  );
  const [environmentalData, setEnvironmentalData] = useState<{
    airQuality: AirQualityResponse | null;
    weather: WeatherResponse | null;
    city: string;
  } | null>(null);
  const { toast } = useToast();

  const form = useForm<ConsentFormData>({
    resolver: zodResolver(consentFormSchema),
    defaultValues: initialData || {
      fullName: "",
      age: 0,
      gender: undefined,
      skinType: undefined,
      topConcern: [],
      address: "",
      city: "",
      state: "",
      country: "",
    },
  });

  useEffect(() => {
    if (addressInputRef.current && window.google?.maps?.places) {
      autocompleteRef.current = new google.maps.places.Autocomplete(
        addressInputRef.current,
        {
          types: ["geocode"],
        }
      );

      autocompleteRef.current.addListener("place_changed", async () => {
        const place = autocompleteRef.current?.getPlace();
        if (place?.formatted_address) {
          form.setValue("address", place.formatted_address, { shouldValidate: true });

          let city = "";
          let state = "";
          let country = "";

          place.address_components?.forEach((component: google.maps.places.AddressComponent) => {
            const types = component.types;
            if (types.includes("locality")) {
              city = component.long_name;
            }
            if (types.includes("administrative_area_level_1")) {
              state = component.long_name;
            }
            if (types.includes("country")) {
              country = component.long_name;
            }
          });

          form.setValue("city", city, { shouldValidate: true });
          form.setValue("state", state, { shouldValidate: true });
          form.setValue("country", country, { shouldValidate: true });
          
          if ((place as any).geometry?.location) {
            const coords = {
              lat: (place as any).geometry.location.lat(),
              lng: (place as any).geometry.location.lng(),
            };
            setCoordinates(coords);
            
            // Fetch environmental data
            const envData = await fetchEnvironmentalData(coords);
            setEnvironmentalData({
              airQuality: envData.airQuality,
              weather: envData.weather,
              city: city || state || country,
            });
          }
          
          setAddressSelected(true);
        }
      });
    }
  }, [form]);

  const handleFormSubmit = async (data: ConsentFormData) => {
    setIsSubmitting(true);

    try {
      const patientData = coordinates ? { ...data, coordinates } : data;
      
      sessionStorage.savePatientData(patientData);

      if (coordinates) {
        fetchEnvironmentalData(coordinates).then(({ airQuality, weather }) => {
          try {
            if (airQuality) {
              sessionStorage.saveAirQuality({
                ...airQuality,
                timestamp: new Date().toISOString(),
              });
            }
            if (weather) {
              sessionStorage.saveWeather({
                ...weather,
                timestamp: new Date().toISOString(),
              });
            }
          } catch (error) {
            console.error('Failed to save environmental data in background:', error);
          }
        });
      } else if (data.address !== lastSubmittedAddress) {
        toast({
          title: "Location not found",
          description: "We couldn't get coordinates for your address, but you can still proceed.",
          duration: 5000,
        });
      }

      setLastSubmittedAddress(data.address);
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
    <Card className="bg-[#f8f8f8] dark:bg-gray-900/50">
      <CardHeader>
        <CardTitle className="text-2xl">Your Skin Story Starter</CardTitle>
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
                    <FormLabel className="text-base">What's the name behind that glow? 👋</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Alex Rivera"
                        data-testid="input-fullname"
                        autoComplete="off"
                        className="min-h-11 text-base"
                        {...field}
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
                    <FormLabel className="flex items-center gap-2 text-base">
                      How many trips around the sun? 🌞
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>This lets us tweak for your vibe—antioxidants for 20s pollution fighters, peptides for 40+ firmness.</p>
                        </TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="25"
                        data-testid="input-age"
                        autoComplete="off"
                        className="min-h-11 text-base"
                        {...field}
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
                  <FormLabel className="flex items-center gap-2 text-base">
                    Your vibe? (We keep it light—no judgments.) 💫
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Hormones play a role—e.g., oil control for testosterone-driven 20s guys, hydration heroes for estrogen dips in women.</p>
                      </TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
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
                  <FormLabel className="flex items-center gap-2 text-base">
                    Your skin's mood today? (Flaky rebel or oily adventurer?) 🧴
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>This fine-tunes emulsions—e.g., lightweight gels for oily types in humid climate.</p>
                      </TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
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
                            className="min-h-[80px] flex flex-col items-center justify-center gap-2 px-2 py-3"
                            onClick={() => field.onChange(type.value)}
                            data-testid={`button-skintype-${type.value}`}
                          >
                            <Icon className="w-6 h-6" />
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
                  <FormLabel className="flex items-center gap-2 text-base">
                    What's bugging your glow most? (Pick 1-2—we've got fixes.) 🔥
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Zeroes in on heroes like bakuchiol for lines or niacinamide for redness, synced to your water quality.</p>
                      </TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-3">
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
                            className="rounded-full min-h-11 px-6 text-base"
                            disabled={isDisabled}
                            onClick={() => {
                              const currentValues = field.value || [];
                              if (isSelected) {
                                field.onChange(currentValues.filter((v: string) => v !== concern));
                              } else if (currentValues.length < 2) {
                                field.onChange([...currentValues, concern]);
                              }
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

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-base">
                    <MapPin className="w-4 h-4" />
                    Address *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Start typing your address..."
                      data-testid="input-address"
                      autoComplete="off"
                      className="min-h-11 text-base"
                      {...field}
                      ref={addressInputRef}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">City *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter city"
                        data-testid="input-city"
                        autoComplete="off"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          if (field.value === "" || !addressSelected) {
                            setAddressSelected(false);
                          }
                        }}
                        readOnly={field.value !== "" && addressSelected}
                        className={`min-h-11 text-base ${field.value !== "" && addressSelected ? "bg-muted" : ""}`}
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
                    <FormLabel className="text-base">State *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter state"
                        data-testid="input-state"
                        autoComplete="off"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          if (field.value === "" || !addressSelected) {
                            setAddressSelected(false);
                          }
                        }}
                        readOnly={field.value !== "" && addressSelected}
                        className={`min-h-11 text-base ${field.value !== "" && addressSelected ? "bg-muted" : ""}`}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Country *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter country"
                        data-testid="input-country"
                        autoComplete="off"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          if (field.value === "" || !addressSelected) {
                            setAddressSelected(false);
                          }
                        }}
                        readOnly={field.value !== "" && addressSelected}
                        className={`min-h-11 text-base ${field.value !== "" && addressSelected ? "bg-muted" : ""}`}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Environmental Data Display */}
            {environmentalData && environmentalData.city && (
              <div className="mt-8 p-5 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-start gap-3 mb-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-base font-medium mb-1">
                      We grabbed <span className="font-semibold text-primary">{environmentalData.city}</span>!
                    </p>
                    <div className="space-y-2 text-sm">
                      {environmentalData.airQuality?.aqi !== undefined && environmentalData.airQuality?.aqi !== null && (
                        <div className="flex items-center gap-2">
                          <Wind className="w-4 h-4 text-muted-foreground" />
                          <span>
                            AQI: <span className="font-semibold">{environmentalData.airQuality.aqi}</span> 
                            {' '}({environmentalData.airQuality.category || 'Good'}) - 
                            {environmentalData.airQuality.aqi > 150 ? ' Extra anti-pollution shields in your mix.' : ' Clean air protection included.'}
                          </span>
                        </div>
                      )}
                      {environmentalData.weather?.uvIndex !== undefined && environmentalData.weather?.uvIndex !== null && (
                        <div className="flex items-center gap-2">
                          <Sun className="w-4 h-4 text-muted-foreground" />
                          <span>
                            UV Index: <span className="font-semibold">{environmentalData.weather.uvIndex}</span> - 
                            {environmentalData.weather.uvIndex > 7 ? ' Strong protection recommended.' : environmentalData.weather.uvIndex > 3 ? ' Moderate UV care needed.' : ' Minimal UV exposure.'}
                          </span>
                        </div>
                      )}
                      {environmentalData.weather?.humidity !== undefined && environmentalData.weather?.humidity !== null && (
                        <div className="flex items-center gap-2">
                          <Droplets className="w-4 h-4 text-muted-foreground" />
                          <span>
                            Humidity: <span className="font-semibold">{environmentalData.weather.humidity}%</span> - 
                            {environmentalData.weather.humidity > 70 ? ' Lightweight formulas for your climate.' : ' Hydration boost for balanced skin.'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Behind the Scenes Accordion */}
            <div className="mt-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="behind-scenes" className="border-none">
                  <AccordionTrigger className="text-base font-medium hover:no-underline text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Behind the Scenes: How We Analyze Your World
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground space-y-3 pt-2">
                    <div className="flex gap-3">
                      <Wind className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground mb-1">Air Quality Index (AQI)</p>
                        <p>We check pollution levels in your city. Higher AQI means more free radicals attacking your skin, so we recommend stronger antioxidants like vitamin C and niacinamide.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Sun className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground mb-1">UV Index</p>
                        <p>Your local sun intensity guides our sunscreen and protection recommendations. High UV? We'll suggest broad-spectrum SPF 50+ and antioxidants.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Droplets className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground mb-1">Humidity Levels</p>
                        <p>Humidity affects how products absorb. High humidity? Lighter gels. Low humidity? Richer creams to lock in moisture.</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </form>
        </Form>
      </CardContent>

      <div className="px-6 pb-6 space-y-4">
        <Button
          type="submit"
          onClick={form.handleSubmit(handleFormSubmit)}
          size="lg"
          className="w-full px-8 h-12 group"
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
        <div className="text-center text-sm text-muted-foreground italic">
          <span className="inline-flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            Did you know? AQI over 150 doubles free radical damage—our antioxidant picks fight back!
          </span>
        </div>
      </div>
    </Card>
  );
}
