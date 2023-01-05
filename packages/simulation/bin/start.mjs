import { main } from 'effection';
import { createAuth0Server } from '@simulacrum/auth0-simulator';

import { faker } from '@faker-js/faker';

main(function* () {
  const store = new Map();

  const serviceURL = new URL('https://localhost:4400');
  const people = [
    {
      id: 'testuser',
      name: 'Test User',
      password: 'password',
      email: 'test@frontside.com',
      picture: faker.image.avatar(),
    },
  ];

  yield createAuth0Server({
    debug: false,
    config: {
      clientID: 'backstage_auth0_client_id',
      scope: 'openid user profile offline_access',
      audience: 'https://frontside-backstage',
      port: parseInt(serviceURL.port),
    },
    store,
    people,
    port: parseInt(serviceURL.port),
    serviceURL: () => serviceURL,
  });

  console.log(`🚀 Auth0 is running on ${serviceURL}`);
  console.log('Accounts:');
  console.table(people);
  try {
    yield;
  } finally {
    console.log('\n⏬ Auth0 shutting down');
  }
});
