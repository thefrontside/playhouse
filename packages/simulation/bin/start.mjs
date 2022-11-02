import { main } from 'effection';
import { createAuth0Server } from '@simulacrum/auth0-simulator';

import { default as faker } from '@faker-js/faker';

main(function* () {

  const store = new Map();

  const serviceUrl = new URL('https://localhost:4400');
  const people = [
    {
      id: 'paulwaters',
      name: 'Paul Waters',
      password: 'password',
      email: 'paulwaters@placeholder.com',
      picture: faker.image.avatar(),
    }
  ];

  yield createAuth0Server({
    config: {
      clientID: 'backstage_auth0_client_id',
      scope: 'openid user profile offline_access',
      audience: 'https://frontside-backstage',
      port: parseInt(serviceUrl.port),
    },
    store,
    people,
    serviceURL: () => serviceUrl
  });

  console.log(`🚀 Auth0 is running on ${serviceUrl}`);
  console.log("Accounts:")
  console.table(people)
  try {
    yield;
  } finally {
    console.log("\n⏬ Auth0 shutting down");
  }
});
