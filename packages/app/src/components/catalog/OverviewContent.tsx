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
      $HumanitecCardComponent: true
  - $Grid:
      item: true
      md: 4
      xs: 12
    children:
      $EntityLinksCard: true
  - $Grid:
      item: true
      md: 8
      xs: 12
    children:
      $EntityHasSubcomponentsCard:
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

  const [yaml, setYaml] = useState<string>(overviewContentLayout);

  if (isEditing) {
    return (
      <Grid container spacing={3}>
        <Grid item md={8}>
          <PSOverviewContent yaml={yaml} />
        </Grid>
        <Grid item md={4}>
          <PlatformScriptEditor 
            yaml={yaml} 
            onChange={setYaml} 
            initialYaml={overviewContentLayout} 
          />
        </Grid>
      </Grid>
    )
  }

  return <PSOverviewContent yaml={overviewContentLayout} />;
}
