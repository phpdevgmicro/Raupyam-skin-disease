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
import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { fetchAirQualityInBackground, type Coordinates } from "@/lib/googleApis";
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
  const [addressSelected, setAddressSelected] = useState(false);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const { toast } = useToast();

  const form = useForm<ConsentFormData>({
    resolver: zodResolver(consentFormSchema),
    defaultValues: initialData || {
      fullName: "",
      age: 0,
      gender: undefined,
      skinType: undefined,
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

      autocompleteRef.current.addListener("place_changed", () => {
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
            setCoordinates({
              lat: (place as any).geometry.location.lat(),
              lng: (place as any).geometry.location.lng(),
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
        fetchAirQualityInBackground(coordinates, (airQualityData) => {
          try {
            sessionStorage.saveAirQuality({
              ...airQualityData,
              timestamp: new Date().toISOString(),
            });
          } catch (error) {
            console.error('Failed to save air quality data in background:', error);
          }
        });
      } else {
        toast({
          title: "Location not found",
          description: "We couldn't get coordinates for your address, but you can still proceed.",
        });
      }

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
        <CardTitle className="text-xl">Patient Information</CardTitle>
        <CardDescription>
          Please provide your information before proceeding with the skin analysis. All information is kept confidential.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        data-testid="input-fullname"
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
                    <FormLabel>Age *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="25"
                        data-testid="input-age"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      data-testid="select-gender"
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
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
                    <FormLabel>Skin Type *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      data-testid="select-skintype"
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select skin type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="oily">Oily</SelectItem>
                        <SelectItem value="dry">Dry</SelectItem>
                        <SelectItem value="combination">Combination</SelectItem>
                        <SelectItem value="sensitive">Sensitive</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Address *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Start typing your address..."
                      data-testid="input-address"
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
                    <FormLabel>City *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter city"
                        data-testid="input-city"
                        {...field}
                        readOnly={!addressSelected || field.value !== ""}
                        className={!addressSelected || field.value !== "" ? "bg-muted" : ""}
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
                    <FormLabel>State *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter state"
                        data-testid="input-state"
                        {...field}
                        readOnly={!addressSelected || field.value !== ""}
                        className={!addressSelected || field.value !== "" ? "bg-muted" : ""}
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
                    <FormLabel>Country *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter country"
                        data-testid="input-country"
                        {...field}
                        readOnly={!addressSelected || field.value !== ""}
                        className={!addressSelected || field.value !== "" ? "bg-muted" : ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                size="lg"
                className="w-full md:w-auto px-8"
                data-testid="button-submit-consent"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Continue to Image Upload"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
