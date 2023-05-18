import { TemplateParameterSchema } from '@backstage/plugin-scaffolder-react';
import { useTemplateSchema } from '@backstage/plugin-scaffolder-react/alpha';
import { useState } from 'react';

interface Props {
  manifest: TemplateParameterSchema;
}
export function useStepper({ manifest }: Props) {
  const { steps } = useTemplateSchema(manifest);
  const [activeStep, setActiveStep] = useState(0);

  const handleBack = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1);
  };

  const handleForward = () => {
    setActiveStep(prevActiveStep => {
      return prevActiveStep + 1;
    });
  };

  return { steps, handleBack, handleForward, activeStep };
}
