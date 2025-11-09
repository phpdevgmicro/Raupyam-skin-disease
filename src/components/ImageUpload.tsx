import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Camera, X, ImagePlus, Sparkles } from "lucide-react";
import CameraCapture from "./CameraCapture";

interface ImageUploadProps {
  onImagesChange: (images: string[]) => void;
  onStartAnalysis?: () => void;
}

export default function ImageUpload({ onImagesChange, onStartAnalysis }: ImageUploadProps) {
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
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
        data-testid="input-file-upload"
      />

      {!image ? (
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
      ) : (
        <div className="space-y-4">
          <Card className="relative overflow-hidden">
            <CardContent className="p-0">
              <div className="relative w-full" style={{ height: 'calc(100vh - 400px)', minHeight: '500px', maxHeight: '800px' }}>
                <img
                  src={image}
                  alt="Uploaded image"
                  className="w-full h-full object-cover rounded-md"
                  data-testid="image-preview"
                />
                
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-sm"
                    data-testid="button-change-image"
                  >
                    <Upload className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={removeImage}
                    className="bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-sm"
                    data-testid="button-remove-image"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {onStartAnalysis && (
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
                    <Button
                      size="lg"
                      onClick={onStartAnalysis}
                      className="w-full h-14 bg-[#34a853] hover:bg-[#2d8e47] text-white font-semibold gap-2 shadow-lg text-base"
                      data-testid="button-start-analysis"
                    >
                      <Sparkles className="w-5 h-5" />
                      Start Analysis
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
