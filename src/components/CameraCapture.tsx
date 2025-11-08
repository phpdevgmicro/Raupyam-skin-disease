import { useState, useRef } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
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
    <div className="fixed inset-0 z-50 bg-black">
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
      
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full w-12 h-12 z-10"
          data-testid="button-close-camera"
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 pb-8 pt-6 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-center gap-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCamera}
            className="bg-white/20 hover:bg-white/30 text-white rounded-full w-12 h-12 backdrop-blur-sm"
            data-testid="button-toggle-camera"
          >
            <FlipHorizontal className="w-6 h-6" />
          </Button>
          
          <button
            onClick={capture}
            className="w-20 h-20 rounded-full bg-white border-4 border-[#34a853] hover:scale-105 transition-transform shadow-lg active:scale-95"
            data-testid="button-capture-photo"
          >
            <div className="w-full h-full rounded-full bg-[#34a853] p-2 flex items-center justify-center">
              <Camera className="w-10 h-10 text-white" />
            </div>
          </button>
          
          <div className="w-12 h-12" />
        </div>
        
        <p className="text-sm text-white/90 text-center mt-4">
          {facingMode === "user" ? "Front Camera" : "Back Camera"}
        </p>
      </div>
    </div>
  );
}
