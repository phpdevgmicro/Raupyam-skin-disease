import { useState, useRef } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, X, FlipHorizontal } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (imageSrc: string) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const webcamRef = useRef<Webcam>(null);

  const capture = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      onCapture(imageSrc);
    }
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>Camera</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          data-testid="button-close-camera"
        >
          <X className="w-5 h-5" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              facingMode: facingMode,
            }}
            className="w-full h-full object-cover"
            data-testid="webcam-preview"
          />
        </div>

        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleCamera}
            data-testid="button-toggle-camera"
          >
            <FlipHorizontal className="w-5 h-5" />
          </Button>
          <Button
            size="lg"
            className="rounded-full w-16 h-16"
            onClick={capture}
            data-testid="button-capture-photo"
          >
            <Camera className="w-6 h-6" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground text-center">
          {facingMode === "user" ? "Front Camera" : "Back Camera"}
        </p>
      </CardContent>
    </Card>
  );
}
