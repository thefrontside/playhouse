import React, { useMemo, useState } from 'react';
import { useEntity } from '@backstage/plugin-catalog-react';
import { PSOverviewContent } from './PSOverviewContent';
import { stringify } from 'yaml';
import { Grid } from '@material-ui/core';
import { PlatformScriptEditor } from '../PlatformScriptPage';

const defaultOverviewContent = `
$Grid:
  container: true
  spacing: 3
  alignItems: stretch
children:
  - $Grid:
      item: true
      md: 6
    children:
      - $EntityAboutCard:
          variant: gridItem
  - $Grid:
      item: true
      md: 6
    children:
      - $HumanitecCardComponent:
          key: "0"
  - $Grid:
      item: true
      md: 4
      xs: 12
    children:
      - $EntityLinksCard:
          key: "0"
  - $Grid:
      item: true
      md: 8
      xs: 12
    children:
      - $EntityHasSubcomponentsCard:
          variant: gridItem  
`

export function OverviewContent({ isEditing }: { isEditing?: boolean }) {
  const { entity } = useEntity();

  const overviewContentLayout = useMemo(() => {
    if (entity?.spec?.overviewContentLayout) {
      return stringify(entity?.spec?.overviewContentLayout);
    }
    return defaultOverviewContent;
  }, [entity?.spec?.overviewContentLayout]);

  if (isEditing) {
    return (
      <Grid container spacing={3}>
        <Grid item md={8}>
          <PSOverviewContent yaml={overviewContentLayout} />
        </Grid>
        <Grid item md={4}>
          <PlatformScriptEditor initialYaml={overviewContentLayout} />
        </Grid>
      </Grid>
    )
  }

  return <PSOverviewContent yaml={overviewContentLayout} />;
}
