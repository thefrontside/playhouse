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

export const Install = () => (
  <Page themeId="tool">
    <Header title="Welcome to platform!" subtitle="Optional subtitle">
      <HeaderLabel label="Owner" value="Team X" />
      <HeaderLabel label="Lifecycle" value="Alpha" />
    </Header>
    <Content>
      <ContentHeader title="Plugin title">
        <SupportButton>A description of your plugin goes here.</SupportButton>
      </ContentHeader>
      <Grid container spacing={3} direction="column">
        <Grid item>
          <InfoCard title="Information card">
            <Typography variant="body1">
              <span style={{"userSelect": "all"}}>curl -sSL http://localhost:7007/api/idp/install.sh | sh</span>
            </Typography>
          </InfoCard>
        </Grid>
        <Grid item>
          <AllExecutables />
        </Grid>
      </Grid>
    </Content>
  </Page>
);