import React from 'react';
import { Grid } from '@material-ui/core';
import {
  EntityDependsOnComponentsCard,
  EntityDependsOnResourcesCard, EntityLayout
} from '@backstage/plugin-catalog';
import { OverviewContent } from './OverviewContent';
import DashboardIcon from '@material-ui/icons/Dashboard';
import { useToggle } from '../../hooks';
import { cicdContent, techdocsContent } from './EntityPage';

export function WebsiteLayout() {
  const [isEditing, toggleIsEditing] = useToggle();

  return (
    <EntityLayout UNSTABLE_extraContextMenuItems={[
      {
        title: "Edit layout",
        Icon: DashboardIcon,
        onClick: () => toggleIsEditing()
      }
    ]}>
      <EntityLayout.Route path="/" title="Overview">
        <OverviewContent isEditing={isEditing} />
      </EntityLayout.Route>

      <EntityLayout.Route path="/ci-cd" title="CI/CD">
        {cicdContent}
      </EntityLayout.Route>

      <EntityLayout.Route path="/dependencies" title="Dependencies">
        <Grid container spacing={3} alignItems="stretch">
          <Grid item md={6}>
            <EntityDependsOnComponentsCard variant="gridItem" />
          </Grid>
          <Grid item md={6}>
            <EntityDependsOnResourcesCard variant="gridItem" />
          </Grid>
        </Grid>
      </EntityLayout.Route>

      <EntityLayout.Route path="/docs" title="Docs">
        {techdocsContent}
      </EntityLayout.Route>
    </EntityLayout>
  );
}
