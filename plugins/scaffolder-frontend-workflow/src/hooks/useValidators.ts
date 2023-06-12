import { useMemo } from 'react';
import { NextFieldExtensionOptions } from '@backstage/plugin-scaffolder-react/alpha';

export type Validators = ReturnType<typeof useValidators>; 

export function useValidators({ extensions }: { extensions: NextFieldExtensionOptions<any, any>[]; }) {
  return useMemo(() => {
    return Object.fromEntries(
      extensions.map(({ name, validation }) => [name, validation])
    );
  }, [extensions]);
}
