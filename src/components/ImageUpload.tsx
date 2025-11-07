import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Camera, X, ImagePlus } from "lucide-react";
import CameraCapture from "./CameraCapture";

interface ImageUploadProps {
  onImagesChange: (images: string[]) => void;
}

export default function ImageUpload({ onImagesChange }: ImageUploadProps) {
  const [image, setImage] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      const imageSrc = reader.result as string;
      setImage(imageSrc);
      onImagesChange([imageSrc]);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = (imageSrc: string) => {
    setImage(imageSrc);
    onImagesChange([imageSrc]);
    setShowCamera(false);
  };

  const removeImage = () => {
    setImage(null);
    onImagesChange([]);
  };

  if (showCamera) {
    return (
      <CameraCapture
        onCapture={handleCameraCapture}
        onClose={() => setShowCamera(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          className="hover-elevate cursor-pointer border-2 border-dashed transition-colors hover:border-primary/50"
          onClick={() => fileInputRef.current?.click()}
          data-testid="card-upload-file"
        >
          <CardContent className="flex flex-col items-center justify-center min-h-56 p-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <p className="font-semibold text-lg text-center mb-2">Upload Image</p>
            <p className="text-sm text-muted-foreground text-center">
              Click to browse or drag and drop
            </p>
            <p className="text-xs text-muted-foreground text-center mt-2">
              PNG, JPG or JPEG (one image only)
            </p>
          </CardContent>
        </Card>

        <Card
          className="hover-elevate cursor-pointer border-2 border-dashed transition-colors hover:border-primary/50"
          onClick={() => setShowCamera(true)}
          data-testid="card-upload-camera"
        >
          <CardContent className="flex flex-col items-center justify-center min-h-56 p-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Camera className="w-8 h-8 text-primary" />
            </div>
            <p className="font-semibold text-lg text-center mb-2">Take Photo</p>
            <p className="text-sm text-muted-foreground text-center">
              Use your device camera
            </p>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Front or back camera available
            </p>
          </CardContent>
        </Card>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
        data-testid="input-file-upload"
      />

      {image && (
        <div className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ImagePlus className="w-5 h-5 text-primary" />
              Uploaded Image
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              data-testid="button-change-image"
            >
              <Upload className="w-4 h-4 mr-2" />
              Change Image
            </Button>
          </div>
          <div className="max-w-md mx-auto">
            <div
              className="relative group aspect-square rounded-lg overflow-hidden border-2 border-border"
              data-testid="image-preview"
            >
              <img
                src={image}
                alt="Uploaded image"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <button
                  onClick={removeImage}
                  className="opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground rounded-full p-2 hover-elevate"
                  data-testid="button-remove-image"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
