import { useMemo } from 'react';
import type { FieldExtensionOptions } from '@backstage/plugin-scaffolder-react';

export type Validators = ReturnType<typeof useValidators>;

export function useValidators({
  extensions,
}: {
  extensions: FieldExtensionOptions<any, any>[];
}) {
  return useMemo(() => {
    return Object.fromEntries(
      extensions.map(({ name, validation }) => [name, validation]),
    );
  }, [extensions]);
}
