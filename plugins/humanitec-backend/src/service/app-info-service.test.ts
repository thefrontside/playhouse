import { setTimeout } from 'node:timers/promises';
import * as common from '@frontside/backstage-plugin-humanitec-common';

import { AppInfoService } from './app-info-service';

const fetchInterval = 50;
const slowFetchTimeout = 100;

let returnError = false;
let slowFetch = false
const fakeAppInfo = { fake: 'res' }
const fakeError = new Error('fake error');

jest.mock('@frontside/backstage-plugin-humanitec-common', () => ({
  createHumanitecClient: jest.fn(),
  fetchAppInfo: jest.fn(async () => {
    if (returnError) {
      throw fakeError;
    }

    if (slowFetch) {
      await setTimeout(100);
    }

    return fakeAppInfo;
  }),
}))

describe('AppInfoService', () => {
  afterEach(() => {
    jest.clearAllMocks();
    returnError = false;
    slowFetch = false;
  });

  it('single subscriber', async () => {
    const service = new AppInfoService('token', fetchInterval);
    const subscriber = jest.fn();

    const close = service.addSubscriber('orgId', 'appId', subscriber);

    await setTimeout(50);

    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(subscriber).toHaveBeenLastCalledWith({ id: 0, data: fakeAppInfo });
    expect(common.createHumanitecClient).toHaveBeenCalledTimes(1);

    await setTimeout(fetchInterval);

    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(subscriber).toHaveBeenLastCalledWith({ id: 1, data: fakeAppInfo });
    expect(common.createHumanitecClient).toHaveBeenCalledTimes(2);

    close();

    await setTimeout(fetchInterval * 2);

    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(common.createHumanitecClient).toHaveBeenCalledTimes(2);
  });

  it('single subscriber, recovers after an error', async () => {
    returnError = true

    const service = new AppInfoService('token', fetchInterval);
    const subscriber = jest.fn();

    const close = service.addSubscriber('orgId', 'appId', subscriber);

    await setTimeout(50);

    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(subscriber).toHaveBeenLastCalledWith({ id: 0, error: fakeError });
    expect(common.createHumanitecClient).toHaveBeenCalledTimes(1);

    returnError = false;

    await setTimeout(fetchInterval);

    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(subscriber).toHaveBeenLastCalledWith({ id: 1, data: fakeAppInfo });
    expect(common.createHumanitecClient).toHaveBeenCalledTimes(2);

    close();

    await setTimeout(fetchInterval * 2);

    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(common.createHumanitecClient).toHaveBeenCalledTimes(2);
  });

  it('single subscriber, disconnects with slow fetch', async () => {
    slowFetch = true

    const service = new AppInfoService('token', fetchInterval);
    const subscriber = jest.fn();

    const close = service.addSubscriber('orgId', 'appId', subscriber);

    await setTimeout(slowFetchTimeout / 2);

    expect(subscriber).toHaveBeenCalledTimes(0);
    expect(common.createHumanitecClient).toHaveBeenCalledTimes(1);

    close();

    // Wait for two cycles to ensure that the fetch is not retried.
    await setTimeout((slowFetchTimeout + fetchInterval) * 2);

    expect(common.createHumanitecClient).toHaveBeenCalledTimes(1);
  });

  it('two subscribers', async () => {
    const service = new AppInfoService('token', fetchInterval);
    const subscriber1 = jest.fn();
    const subscriber2 = jest.fn();

    const close1 = service.addSubscriber('orgId', 'appId', subscriber1);
    const close2 = service.addSubscriber('orgId', 'appId', subscriber2);

    await setTimeout(fetchInterval);

    expect(subscriber1).toHaveBeenCalledTimes(1);
    expect(subscriber2).toHaveBeenCalledTimes(1);
    expect(subscriber1).toHaveBeenLastCalledWith({ id: 0, data: fakeAppInfo });
    expect(subscriber2).toHaveBeenLastCalledWith({ id: 0, data: fakeAppInfo });
    expect(common.createHumanitecClient).toHaveBeenCalledTimes(1);

    await setTimeout(fetchInterval);

    expect(subscriber1).toHaveBeenCalledTimes(2);
    expect(subscriber1).toHaveBeenLastCalledWith({ id: 1, data: fakeAppInfo });
    expect(subscriber2).toHaveBeenCalledTimes(2);
    expect(subscriber2).toHaveBeenLastCalledWith({ id: 1, data: fakeAppInfo });
    expect(common.createHumanitecClient).toHaveBeenCalledTimes(2);

    close1();

    await setTimeout(fetchInterval);

    expect(subscriber1).toHaveBeenCalledTimes(2);
    expect(subscriber2).toHaveBeenCalledTimes(3);
    expect(subscriber2).toHaveBeenLastCalledWith({ id: 2, data: fakeAppInfo });
    expect(common.createHumanitecClient).toHaveBeenCalledTimes(3);

    close2();

    await setTimeout(fetchInterval);

    expect(subscriber1).toHaveBeenCalledTimes(2);
    expect(subscriber2).toHaveBeenCalledTimes(3);
    expect(common.createHumanitecClient).toHaveBeenCalledTimes(3);
  });
});
