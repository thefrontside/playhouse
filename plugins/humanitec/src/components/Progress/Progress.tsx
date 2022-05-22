import React, { useState, useEffect, PropsWithChildren } from 'react';
import CircularProgress, { CircularProgressProps } from '@material-ui/core/CircularProgress';

export function Progress(props: PropsWithChildren<CircularProgressProps>) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => setIsVisible(true), 250);
    return () => clearTimeout(handle);
  }, []);

  return isVisible ? (
    <CircularProgress {...props} />
  ) : (
    <div style={{ display: 'none' }} />
  );
}
