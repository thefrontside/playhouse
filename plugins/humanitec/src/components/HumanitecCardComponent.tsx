import React, { ReactNode } from 'react';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useAppInfo } from '../hooks/useAppInfo';
import { HumanitecAnnotationedEntity } from '../types';
import { useHumanitecParams } from '../hooks/useHumanitecParams';
import { useStyles } from '../hooks/useStyles';
import CardHeader from '@material-ui/core/CardHeader';
import { Button, Card, CardContent, Divider } from '@material-ui/core';
import { HumanitecLogoIcon } from './HumanitecLogoIcon';
import { HUMANITEC_APP_ID_ANNOTATION, HUMANITEC_MISSING_ANNOTATION_ERROR, HUMANITEC_ORG_ID_ANNOTATION } from '../annotations';
import { HumanitecCardContent } from './HumanitecCardContent';
import { HumanitecAnnotationsEmptyState } from './HumanitecAnnotationsEmptyState';

interface HumanitecCardComponentProps {
}

export function HumanitecCardComponent({ }: HumanitecCardComponentProps) {
  const { entity } = useEntity<HumanitecAnnotationedEntity>();

  const orgId = entity.metadata.annotations[HUMANITEC_ORG_ID_ANNOTATION];
  const appId = entity.metadata.annotations[HUMANITEC_APP_ID_ANNOTATION];
  const appUrl = `https://app.humanitec.io/orgs/${orgId}/apps/${appId}`;

  const data = useAppInfo({
    appId,
    orgId,
  });

  const [params, actions] = useHumanitecParams();

  const classes = useStyles();

  let content: ReactNode = null;
  if (Array.isArray(data)) {
    content = (
      <HumanitecCardContent
        environments={data}
        appUrl={appUrl}
        selectedEnv={params?.envId}
        selectedWorkload={params?.workloadId}
        actions={actions}
      />
    )
  } else if (data instanceof Error && data.message === HUMANITEC_MISSING_ANNOTATION_ERROR) {
    content = (<HumanitecAnnotationsEmptyState />)
  }

  let action: ReactNode = null;
  if (appId && orgId) {
    action = (
      <Button component="a" startIcon={<HumanitecLogoIcon />} href={appUrl}>
        Humanitec App
      </Button>
    )
  }

  return (
    <Card className={`${classes.cardClass}`} >
      <CardHeader
        action={action}
        className={classes.cardHeader}
        title="Deployments"
        subheader="Orchestrated by Humanitec"
      />
      <Divider />
      <CardContent className={classes.gridItemCardContent}>
        {content}
      </CardContent>
    </Card>
  )
}
