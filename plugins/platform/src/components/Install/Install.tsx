import React from 'react';
import { Typography, Grid } from '@material-ui/core';
import {
  InfoCard,
  Header,
  Page,
  Content,
  ContentHeader,
  HeaderLabel,
  SupportButton,
} from '@backstage/core-components';
import { AllExecutables } from '../AllExecutables';
import { executablesApiRef } from '../../api/executables-api';
import { useApi } from '@backstage/core-plugin-api';
import useAsync from 'react-use/lib/useAsync';
import Ansi from 'ansi-to-react';

export const useHelp = () => {
  let api = useApi(executablesApiRef);
  let info = useAsync(api.fetchExecutables, []);
  if (info.loading) {
    return { loading: true };
  } else if (info.error) {
    return info;
  } else if (info.value?.helpText.type === 'rejected' ) {
    return { loading: false, error: info.value.helpText.error };
  } else if (info.value?.helpText.type === 'resolved') {
    return { loading: false, value: info.value?.helpText.value };
  } else {
    return { loading: true };
  }
}

export const Install = () => {
  let helpText = useHelp();
  return (
    <Page themeId="tool">
      <Header title="Internal Developer Platform tools" subtitle="Optional subtitle">
        <HeaderLabel label="Owner" value="Team X" />
        <HeaderLabel label="Lifecycle" value="Alpha" />
      </Header>
      <Content>
        <ContentHeader title="Get Started">
          <SupportButton>Install your company's platform tool</SupportButton>
        </ContentHeader>
        <Grid container spacing={3} direction="column">
          <Grid item>
            <InfoCard title="Install">
              <Typography variant="body1">
                <span style={{"userSelect": "all"}}>curl -sSL http://localhost:7007/api/idp/install.sh | sh</span>
              </Typography>
            </InfoCard>
          </Grid>
          <Grid item>
            <InfoCard title="Help">
              <Typography variant="body1" style={{whiteSpace: "pre"}}>
                <Ansi>{helpText.error ? "" : helpText.value }</Ansi>
              </Typography>
            </InfoCard>
          </Grid>
          <Grid item>
            <AllExecutables />
          </Grid>
        </Grid>
      </Content>
    </Page>
  )
};
