import React from 'react';
import { useEntity } from '@backstage/plugin-catalog-react';
import { HumanitecCard } from './HumanitecCard';
import { useAppInfo } from '../hooks/useAppInfo';
import { HumanitecAnnotationedEntity } from '../types';
import { useHumanitecParams } from '../hooks/useHumanitecParams';
import { useStyles } from '../hooks/useStyles';
import CardHeader from '@material-ui/core/CardHeader';
import { Button } from '@material-ui/core';
import { HumanitecLogoIcon } from './HumanitecLogoIcon';

interface HumanitecCardComponentProps {
  variant: 'gridItem'
}

export function HumanitecCardComponent({ variant }: HumanitecCardComponentProps) {
  const { entity } = useEntity<HumanitecAnnotationedEntity>();

  const appId = entity.metadata.annotations['humanitec.com/appId'];
  const orgId = entity.metadata.annotations['humanitec.com/orgId'];
  const appUrl = `https://app.humanitec.io/orgs/${orgId}/apps/${appId}`;

  const data = useAppInfo({
    appId,
    orgId,
  });

  const [params, actions] = useHumanitecParams();

  const classes = useStyles();

  return (<HumanitecCard
    variant={variant}
    header={
      <CardHeader
        action={
          <Button component="a" startIcon={<HumanitecLogoIcon />} href={appUrl}>
            Humanitec App
          </Button>
        }
        className={classes.cardHeader}
        title="Deployments"
        subheader="Orchestrated by Humanitec"
      />
    }
    environments={data}
    appUrl={appUrl}
    selectedEnv={params?.envId}
    selectedWorkload={params?.workloadId}
    actions={actions}
  />)
}
