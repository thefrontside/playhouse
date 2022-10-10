import React from 'react';
import { Table, TableColumn, Progress } from '@backstage/core-components';
import Alert from '@material-ui/lab/Alert';
import useAsync from 'react-use/lib/useAsync';
import { useApi } from '@backstage/core-plugin-api';

import type { Executables } from '@frontside/backstage-plugin-platform-backend';
import { executablesApiRef } from '../../api/executables-api';

export const DenseTable = ({ executables }: { executables: Executables}) => {

  const columns: TableColumn[] = [
    { title: 'Architecture', field: 'target' },
    { title: 'Status', field: 'status' },
    { title: 'URL', field: 'url' },
  ];

  const data = Object.entries(executables).map(([target, executable]) => {
    return {
      target,
      url: executable.type === 'compiled' ? executable.url : 'N/A',
      status: executable.type,
    };
  });

  return (
    <Table
      title="Downlead my-idp"
      options={{ search: false, paging: false }}
      columns={columns}
      data={data}
    />
  );
};

export const AllExecutables = () => {
  let api = useApi(executablesApiRef);
  const { value, loading, error } = useAsync(api.fetchExecutables, []);

  if (loading) {
    return <Progress />;
  } else if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  } else {
    return <DenseTable executables={value ?? {} as Executables} />;
  }

};
