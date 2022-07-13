import { CodeSnippet } from '@backstage/core-components';
import { BackstageTheme } from '@backstage/theme';
import { makeStyles, Typography } from '@material-ui/core';
import React from 'react';
import { HUMANITEC_APP_ID_ANNOTATION, HUMANITEC_ORG_ID_ANNOTATION } from '../annotations';

const ENTITY_YAML = `metadata:
  name: example
  annotations:
    ${HUMANITEC_ORG_ID_ANNOTATION}: our-org-id
    ${HUMANITEC_APP_ID_ANNOTATION}: our-app-id`;

const useStyles = makeStyles<BackstageTheme>(
  theme => ({
    code: {
      borderRadius: 6,
      margin: `${theme.spacing(2)}px 0px`,
      background: theme.palette.type === 'dark' ? '#444' : '#fff',
    },
  }),
  { name: 'PluginHumanitecAnnotationsEmptyState' },
);

export function HumanitecAnnotationsEmptyState() {
  const classes = useStyles();

  return (
    <>
      <Typography variant="body1">
        No Humanitec annotations defined for this entity. You can add annotations
        to entity YAML as shown in the highlighted example below:
      </Typography>
      <div className={classes.code}>
        <CodeSnippet
          text={ENTITY_YAML}
          language="yaml"
          showLineNumbers
          highlightedNumbers={[3, 4, 5]}
          customStyle={{ background: 'inherit', fontSize: '115%' }}
        />
      </div>
    </>
  );
}