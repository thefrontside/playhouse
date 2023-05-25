import React, { useCallback, useState } from 'react';
import SystemUpdateIcon from '@material-ui/icons/SystemUpdate';
import {
  ModalWorkflow,
  type OnCompleteArgs,
} from '@frontside/backstage-plugin-scaffolder-workflow';
import { Button, IconButton, Tooltip } from '@material-ui/core';
import { ScaffolderFieldExtensions } from '@backstage/plugin-scaffolder-react';
import { EntityPickerFieldExtension } from '@backstage/plugin-scaffolder';
import { useEntity } from '@backstage/plugin-catalog-react';
import { ANNOTATION_ORIGIN_LOCATION, stringifyEntityRef } from '@backstage/catalog-model';
import { assert } from 'assert-ts';

export function UpdateSystem(): JSX.Element {
  const { entity } = useEntity();
  const [open, setOpen] = useState(false);

  const onCreate = useCallback(async (values: OnCompleteArgs) => {
    // eslint-disable-next-line no-console
    console.log(values);
  }, []);

  const closeHandler = useCallback(() => {
    setOpen(false);
  }, [])

  const entityRef = stringifyEntityRef(entity);

  const url = entity.metadata?.annotations?.[
    ANNOTATION_ORIGIN_LOCATION
  ].replace(/^url:/, '');

  assert(
    !!url,
    `no catalog-info.yaml url in ${ANNOTATION_ORIGIN_LOCATION} annotation`,
  );

  return (
    <>
      {entity?.spec?.system ? entity.spec.system : 'System not specified.'}
      <Tooltip title="Assign System">
        <IconButton aria-label="Assign System" color="primary" onClick={() => setOpen(true)}>
          <SystemUpdateIcon />
        </IconButton>
      </Tooltip>
      <ModalWorkflow
        open={open}
        onClick={() => {}}
        onClose={closeHandler}
        onCreate={onCreate}
        namespace="default"
        templateName="update-system"
        initialState={{ url, entityRef, system: entity?.spec?.system ?? '' }}
        onError={(_e) => {
          // eslint-disable-next-line no-console
          console.log('optional error handler')
        }}
      >
        <ScaffolderFieldExtensions>
          <EntityPickerFieldExtension />
        </ScaffolderFieldExtensions>
        <Button
          variant="contained"
          color="primary"
          type="submit"
          onClick={onCreate as any}
        >
          Link
        </Button>
      </ModalWorkflow>
    </>
  );
}
