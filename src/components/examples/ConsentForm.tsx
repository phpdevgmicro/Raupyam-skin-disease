import ConsentForm from '../ConsentForm';

export default function ConsentFormExample() {
  const handleSubmit = (data: any) => {
    console.log('Consent form submitted:', data);
  };

  return <ConsentForm onSubmit={handleSubmit} />;
}
