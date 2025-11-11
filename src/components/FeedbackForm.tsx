import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { feedbackFormSchema, type FeedbackFormData } from "@/types/schema";
import { submitFeedback } from "@/lib/api";
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Loader2 } from "lucide-react";
import { useState } from "react";

export default function FeedbackForm() {
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      suggestion: "",
      email: "",
    },
  });

  const onSubmit = async (data: FeedbackFormData) => {
    setIsPending(true);
    try {
      await submitFeedback(data.suggestion, data.email);
      toast({
        title: "Feedback submitted",
        description: "Thank you for your feedback. We'll get back to you soon.",
        duration: 5000,
      });
      form.reset();
    } catch (error) {
      toast({
        title: "Submission failed",
        description: "There was an error submitting your feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card data-testid="card-feedback-form">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Reply here for tweaks
        </CardTitle>
        <CardDescription className="less-line-height">
          Let us know if you'd like any adjustments to your analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="suggestion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Suggestions *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please share any questions or requests for clarification..."
                      className="min-h-32 resize-none"
                      data-testid="textarea-suggestion"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="your.email@example.com"
                      data-testid="input-feedback-email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>

      {/* Submit button */}
      <div className="flex justify-end px-6 pb-6">
        <Button
          type="submit"
          onClick={form.handleSubmit(onSubmit)}
          className="px-6 h-12 text-lg"
          data-testid="button-submit-feedback"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Feedback"
          )}
        </Button>
      </div>
    </Card>
  );
}
