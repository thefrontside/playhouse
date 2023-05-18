import type { DependencyList } from "react";
import type { Operation } from "effection";
import { useState } from "react";
import { useOperation } from "@effection/react";

export type ResourceState<T> = {
  type: 'pending';
} | {
  type: 'resolved';
  value: T;
} | {
  type: 'rejected';
  error: Error;
}

export function useResource<T>(resource: Operation<T>, deps: DependencyList = []): ResourceState<T> {
  const [state, setState] = useState<ResourceState<T>>({ type: 'pending' });

  useOperation(function*() {
    try {
      yield function* ErrorBoundary() {
        setState({ type: 'resolved', value: yield resource });
        yield;
      }
    } catch (error: any) {
      setState({ type: 'rejected', error });
    }
  }, deps as unknown[]);

  return state;
}
