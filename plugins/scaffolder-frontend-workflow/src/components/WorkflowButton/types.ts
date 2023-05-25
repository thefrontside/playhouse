import { type TaskStream } from '@backstage/plugin-scaffolder-react';
import { type WorkflowProps } from '@backstage/plugin-scaffolder-react/alpha';
import { type JsonValue } from '@backstage/types';
import { type ComponentType } from 'react';
import { TaskStatus } from '../..';

export type WorkflowButtonProps = Pick<
  WorkflowProps,
  'namespace' | 'templateName' | 'initialState'
> &
  Partial<Pick<WorkflowProps, 'onCreate'>> & {
    onComplete?: () => void;
    onError?: (e: Error) => void;
    components: {
      idle: JSX.Element
      pending: JSX.Element
      error: JSX.Element
      success: JSX.Element
      modal: JSX.Element
    }
  };

export type IdleComponentType<T> = ComponentType<IdleComponentProps & T>
export type IdleComponentProps = Partial<{
  execute: (values: Record<string, JsonValue>,) => void
  taskStream: TaskStream
}>


export type PendingComponentType = ComponentType<PendingComponentProps>
export type PendingComponentProps = Partial<{
  taskStream: TaskStream
}>

export type ErrorComponentType = ComponentType<ErrorComponentProps>
export type ErrorComponentProps = Partial<{
  taskStream: TaskStream
}>

export type SuccessComponentType = ComponentType<SuccessComponentProps>
export type SuccessComponentProps = Partial<{
  taskStream: TaskStream
}>

export type ModalComponentProps = Partial<{
  taskStream: TaskStream
  taskStatus: TaskStatus
}>