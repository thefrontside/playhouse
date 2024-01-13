import { EventEmitter } from 'events';

import { createHumanitecClient, fetchAppInfo } from '@frontside/backstage-plugin-humanitec-common';

const fetchInterval = 10000;

export interface AppInfoUpdate {
    id: number;
    data?: any;
    error?: Error;
}

// This service is responsible for fetching app info from Humanitec on an interval and updating all subscribers.
//
// Subscribers aren't fetching app info directly because we want to avoid multiple requests for the same app info.
//
export class AppInfoService {
    private emitter: EventEmitter = new EventEmitter();
    private pending: Record<string, Promise<any>> = {};
    private timeouts: Record<string, NodeJS.Timeout> = {};
    private lastData: Record<string, AppInfoUpdate> = {};

    private token: string;

    constructor(token: string) {
        this.token = token;
    }

    addSubscriber(orgId: string, appId: string, subscriber: (data: AppInfoUpdate) => void): () => void {
        const key = `${orgId}:${appId}`;

        this.emitter.on(key, subscriber);

        // Only fetch app info if a fetch is not pending.
        if (!this.pending[key]) {
            this.fetchAppInfo(orgId, appId);
        } else {
            if (this.lastData[key]) {
                subscriber(this.lastData[key]);
            }
        }

        // Return a function that removes this subscriber when it's no longer interested.
        return () => {
            this.emitter.off(key, subscriber);
            if (this.emitter.listenerCount(key) === 0 && this.timeouts[key]) {
                clearTimeout(this.timeouts[key]);
                delete this.pending[key];
                delete this.timeouts[key];
                delete this.lastData[key];
            }
        };
    }

    private fetchAppInfo(orgId: string, appId: string): Promise<any> {
        const key = `${orgId}:${appId}`;
        const client = createHumanitecClient({ token: this.token, orgId });
        let id = 0;

        this.pending[key] = (async () => {
            const update: AppInfoUpdate = { id: id++ };
            try {
                const data = await fetchAppInfo({ client }, appId);
                update.data = data;

                this.timeouts[key] = setTimeout(()=> this.fetchAppInfo(orgId, appId), fetchInterval);
            } catch (error) {
                if (error instanceof Error) {
                    update.error = error;
                } else {
                    update.error = new Error(`${error}`);
                }
            } finally {
                this.emitter.emit(key, update);
                this.lastData[key] = update;
            }
        })();
        return this.pending[key];
    }
}
