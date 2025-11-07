import CameraCapture from '../CameraCapture';

export default function CameraCaptureExample() {
  const handleCapture = (imageSrc: string) => {
    console.log('Image captured:', imageSrc.substring(0, 50) + '...');
  };

  const handleClose = () => {
    console.log('Camera closed');
  };

  return <CameraCapture onCapture={handleCapture} onClose={handleClose} />;
}
