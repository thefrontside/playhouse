import React from 'react';
import { Grid } from '@material-ui/core';
import { HumanitecControllerPods } from "./types";
import { ValueCard } from "./ValueCard";


export function PodsCard({ label, pods }: { label: string; pods: HumanitecControllerPods[]; }) {
  return (
    <Grid item xs={12}>
      <ValueCard label={label} />
      {pods.map(pod => {
        let podStatus;
        if (pod.phase === "Running") {
          podStatus = "🟢";
        } else if (pod.phase === "Succeeded") {
          podStatus = "⚫️";
        } else if (pod.phase === "Pending") {
          podStatus = "🟡";
        } else {
          podStatus = "🔴";
        }
        return (
          <Grid item key={pod.podName}>
            <div style={{ border: "1px solid", padding: 10, marginTop: 6, borderRadius: 7, display: "inline-flex", justifyContent: "space-between", minWidth: 270 }}>
              <div>{pod.podName}</div>
              <div>{podStatus}</div>
            </div>
          </Grid>
        );
      })}
    </Grid>
  );
}
