import { useCallback } from 'react';
import { useQueryParamState } from '@backstage/core-components';

export interface HumanitecParams {
  envId?: string;
  workloadId?: string;
}

export interface HumanitecParamsActions {
  showEnvironment: (envId: string) => void
  showWorkload: (id: string) => void
}

export function useHumanitecParams(): [HumanitecParams | undefined, HumanitecParamsActions] {
  const [params, setQueryParams] = useQueryParamState<HumanitecParams>('humanitec');

  const showEnvironment = useCallback((envId: string) => {
    setQueryParams({
      envId,
      workloadId: params?.workloadId
    })
  }, [params?.workloadId, setQueryParams]);

  const showWorkload = useCallback((workloadId: string) => {
    setQueryParams({
      envId: params?.envId,
      workloadId
    })
  }, [params?.envId, setQueryParams]);

  return [params, {
    showEnvironment,
    showWorkload
  }]
}