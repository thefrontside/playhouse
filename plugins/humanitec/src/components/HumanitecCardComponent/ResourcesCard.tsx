import React from 'react';
import { Grid } from '@material-ui/core';
import { HumanitecEnvironmentResources } from "./types";
import { ValueCard } from "./ValueCard";


export function ResourcesCard({ label, resources }: { label: string; resources: HumanitecEnvironmentResources[]; }) {
  return (
    <Grid item xs={12}>
      <ValueCard label={label} />
      {resources.map(resource => {
        const status = resource.status === "active"
          ? <span style={{ color: "green" }}>Active</span>
          : <span style={{ color: "yellow" }}>{resource.status}</span>;
        return (
          <Grid item key={resource.def_id}>
            <div style={{ border: "1px solid", padding: 10, marginTop: 6, borderRadius: 7, display: "inline-flex", flexDirection: "column", justifyContent: "space-between", minWidth: 240 }}>
              <span style={{ color: "lightcyan" }}>{resource.def_id}</span>
              <div>Type: {resource.type}</div>
              <div>Status: {status}</div>
            </div>
          </Grid>
        );
      })}
    </Grid>
  );
}
