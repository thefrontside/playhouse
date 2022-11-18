import React, { useMemo } from 'react';
import { useAsync } from 'react-use';

import { createPlatformScript } from 'platformscript';

export function PlatformScriptPage() {
  let ps = useMemo(() => createPlatformScript(), []);


  let result = useAsync(async () => {
    let mod = await ps.load("http://localhost:7007/api/ps/lib/hello.yaml");

    let prog = ps.parse("$greet: Bob");
    let result = await ps.eval(prog, mod.symbols);
    return result;
  }, [ps]);

  if (result.loading) {
    return <h1>...loading</h1>
  } else if (result.error) {
    return <h1>{result.error.message}</h1>
  } else {
    return <h1>{JSON.stringify(result.value?.value)}</h1>
  }
}
