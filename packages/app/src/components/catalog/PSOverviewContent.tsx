import React from 'react';
import { usePlatformScript } from '../PlatformScriptPage';

export function PSOverviewContent({ yaml }: { yaml: string; }) {
  const result = usePlatformScript(yaml);

  console.log(result)

  if (result.loading) {
    return <>Loading...</>;
  }

  if (result.error) {
    return <>{result.error.message}</>;
  }

  return <>{result.value}</>;
}
