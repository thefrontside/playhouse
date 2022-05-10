import React from 'react';

import {
  Header,
  Page,
  Content
} from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { inspectorApiRef } from "../api/inspector-api";
import { useResource } from '../hooks/use-resource';
import { TaskTree } from '@effection/inspect-ui';
import { useSlice } from '@effection/react';
import type { Slice } from '@effection/atom';
import type { InspectState } from '@effection/inspect-utils';

export const InspectorPage = () => {

  return (
    <Page themeId="tool">
    <Header title="Effection Inspector" subtitle="server runtime visualization"/>
    <Content><Inspector/></Content>
  </Page>
  );
}

function Inspector() {
  const inspector = useApi(inspectorApiRef);
  const slice = useResource(inspector.inspectState(), [inspector]);

  if (slice.type === 'pending') {
    return <p>Loading</p>;
  } else if (slice.type === 'rejected') {
    return <p>{slice.error.toString()}</p>;
  } else {
    return <TreeRoot slice={slice.value}/>
  }
}

function TreeRoot({ slice }: { slice: Slice<InspectState> }) {
  const task = useSlice(slice);
  return <TaskTree task={task}/>
}
