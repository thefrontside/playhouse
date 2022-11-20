import React, { useMemo } from 'react';
import { useAsync } from 'react-use';

import * as ps from 'platformscript';
import { Button } from '@material-ui/core';

export function PlatformScriptPage() {
  let globals = ps.map({
    Button: ps.fn(function*({ arg }) {
      return ps.external(<Button>{String(arg.value)}</Button>);
    })
  });
  let platformscript = useMemo(() => ps.createPlatformScript(globals), []);

  let result = useAsync(async () => {
    let mod = await platformscript.load("http://localhost:7007/api/ps/lib/hello.yaml");
    return mod.value;
  }, [ps]);

  if (result.loading) {
    return <h1>...loading</h1>
  } else if (result.error) {
    return <h1>{result.error.message}</h1>
  } else {
    return <h1>{result.value?.value}</h1>
  }
}
