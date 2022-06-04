import { useCallback } from 'react';
import { useQueryParamState } from '@backstage/core-components';

export interface HumanitecParams {
  envId?: string;
}

export interface HumanitecParamsActions {
  showEnvironment: (envId: string) => void
}

export function useHumanitecParams(): [HumanitecParams | undefined, HumanitecParamsActions] {
  const [params, setQueryParams] = useQueryParamState<HumanitecParams>('humanitec');

  const showEnvironment = useCallback((envId: string) => {
    setQueryParams({
      envId
    })
  }, [setQueryParams]);

  return [params, {
    showEnvironment
  }]
}