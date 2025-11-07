import ImageUpload from '../ImageUpload';

export default function ImageUploadExample() {
  const handleImagesChange = (images: string[]) => {
    console.log('Images updated:', images.length);
  };

  return <ImageUpload onImagesChange={handleImagesChange} />;
}
