import { faker as globalFaker, Faker } from '@faker-js/faker';
import { Seed, createDispatch, Generate, GenerateInfo } from '@frontside/graphgen';

function createFaker(seed: Seed): Faker {
 const faker = new Faker({ locales: globalFaker.locales });
  faker.seed(seed() * 1000);
  return faker;
}

const methods = Object.entries(globalFaker).reduce((methods, [name, mod]) => {
  if (mod) {
    for (const [fn, value] of Object.entries(mod)) {
      if (typeof value === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        methods[`@faker/${name}.${fn}`] = ({ faker }: any, args: unknown[]) => {
          return faker[name][fn](...args);
        };
      }
    }
  }
  return methods;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}, {} as Record<string, any>);

const dispatch = createDispatch({
  methods,
  patterns: {
    '*.firstName': '@faker/name.firstName',
    '*.lastName': '@faker/name.lastName',
    '*.name': '@faker/name.findName',
    '*.avatar': '@faker/internet.avatar',
    '*.avatarUrl': '@faker/internet.avatar',
    '*.password': '@faker/internet.password',
  },
  context: (info: GenerateInfo) => ({ ...info, faker: createFaker(info.seed) }),
});

export const fakergen: Generate = info => {
  const result = dispatch.dispatch(info.method, info, info.args);
  if (result.handled) {
    return result.value;
  } else {
    return info.next();
  }
};
