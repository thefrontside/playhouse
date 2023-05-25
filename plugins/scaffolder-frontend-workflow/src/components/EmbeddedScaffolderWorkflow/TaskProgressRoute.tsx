import React from 'react';
import { assert } from 'assert-ts';
import { useParams } from 'react-router-dom';
import { TaskProgress } from '../TaskProgress/TaskProgress';
import { useTaskEventStream } from '../../hooks/useTaskEventStream';

export function TaskProgressRoute(): JSX.Element {
  const { taskId } = useParams();

  assert(!!taskId, `no taskId in path`);

  const taskStream = useTaskEventStream(taskId);

  return <TaskProgress taskStream={taskStream} /> 
}