import { main } from 'effection';
import { createAuth0Server } from '@simulacrum/auth0-simulator';
import { Auth0Store } from '@simulacrum/auth0-simulator/dist/handlers/auth0-handlers';

main(function* () {

  const store: Auth0Store = new Map();

  const serviceUrl = new URL('https://localhost:4400');
  const people = [
    {
      id: 'paulwaters',
      name: 'Paul Waters',
      password: 'password',
      email: 'paulwaters@placeholder.com',
      picture: 'http://www.gravatar.com/avatar/?d=identicon'
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
  yield;

});
