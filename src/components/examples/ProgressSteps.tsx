import ProgressSteps from '../ProgressSteps';

export default function ProgressStepsExample() {
  return (
    <ProgressSteps 
      currentStep={2} 
      steps={['Consent Form', 'Upload Images', 'Analysis', 'Results']} 
    />
  );
}
