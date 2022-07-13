import { useQueryParamState } from '@backstage/core-components';
import { useCallback } from 'react';

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

  const showEnvironment = useCallback((id: string) => {
    if (params) {
      const { envId, workloadId, ...rest } = params;
      if (id === params.envId) {
        setQueryParams(rest)
      } else {
        setQueryParams({
          ...params,
          envId: id
        })
      }
    } else {
      setQueryParams({
        envId: id,
      })
    }

  }, [params, setQueryParams]);

  const showWorkload = useCallback((id: string) => {
    if (params) {
      const { workloadId, ...rest } = params;
      if (id === workloadId) {
        setQueryParams(rest)
      } else {
        setQueryParams({
          ...params,
          workloadId: id
        })
      }
    } else {
      setQueryParams({
        workloadId: id
      })
    }
  }, [params, setQueryParams]);

  return [params, {
    showEnvironment,
    showWorkload
  }]
}