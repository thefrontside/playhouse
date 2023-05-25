const { main } = require("effection");
const SmeeClient = require("smee-client");

const smee = new SmeeClient({
  source: 'https://smee.io/8rZJh2tPD9FPqMg6UNO',
  target: 'http://localhost:7007/api/catalog/github/webhook',
  logger: console
})

// eslint-disable-next-line func-names
main(function* () {
  const events = smee.start();
  try {
    yield;
  } finally {
    events.close();
  }
});
