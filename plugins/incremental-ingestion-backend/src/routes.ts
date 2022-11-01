
import { errorHandler } from '@backstage/backend-common';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { IncrementalIngestionDatabaseManager } from './database/IncrementalIngestionDatabaseManager';

/** @public */
export const createIncrementalProviderRouter = async (
  manager: IncrementalIngestionDatabaseManager,
  logger: Logger,
) => {
  const router = Router();
  router.use(express.json());

  // Get the overall health of all incremental providers
  router.get('/health', async (_, res) => {
    const records = await manager.healthcheck();
    const providers = records.map(record => record.provider_name);
    const duplicates = [
      ...new Set(providers.filter((e, i, a) => a.indexOf(e) !== i)),
    ];

    if (duplicates.length > 0) {
      res.json({ healthy: false, duplicateIngestions: duplicates });
    } else {
      res.json({ healthy: true });
    }
  });

  // Clean up and pause all providers
  router.delete('/cleanup', async (_, res) => {
    const result = await manager.cleanupProviders();
    res.json(result);
  });

  // Get basic status of the provider
  router.get('/:provider', async (req, res) => {
    const { provider } = req.params;
    const record = await manager.getCurrentIngestionRecord(provider);
    if (record) {
      res.json({
        success: true,
        status: {
          current_action: record.status,
          next_action_at: new Date(record.next_action_at),
        },
        last_error: record.last_error,
      });
    } else {
      const providers: string[] = await manager.listProviders();
      if (providers.includes(provider)) {
        res.json({
          success: true,
          status: {
            current_action: 'rest complete, waiting to start',
          },
        });
      } else {
        logger.error(
          `${provider} - No ingestion record found in the database!`,
        );
        res.status(404).json({
          success: false,
          status: {},
          last_error: `Provider '${provider}' not found`,
        });
      }
    }
  });

  // Trigger the provider's next action
  router.put('/:provider', async (req, res) => {
    const { provider } = req.params;
    const record = await manager.getCurrentIngestionRecord(provider);
    if (record) {
      await manager.triggerNextProviderAction(provider);
      res.json({
        success: true,
        message: `${provider}: Next action triggered.`,
      });
    } else {
      const providers: string[] = await manager.listProviders();
      if (providers.includes(provider)) {
        logger.debug(`${provider} - Ingestion record found`);
        res.json({
          success: true,
          message: 'Unable to trigger next action (provider is restarting)',
        });
      } else {
        res.status(404).json({
          success: false,
          message: `Provider '${provider}' not found`,
        });
      }
    }
  });

  // Start a brand-new ingestion cycle for the provider
  router.post('/:provider', async (req, res) => {
    const { provider } = req.params;

    const record = await manager.getCurrentIngestionRecord(provider);
    if (record) {
      await manager.updateByName(provider, {
        next_action: 'nothing (done)',
        ingestion_completed_at: new Date(),
        rest_completed_at: new Date(),
        status: 'complete',
      });
      res.json({
        success: true,
        message: `${provider}: Next cycle triggered.`,
      });
    } else {
      const providers: string[] = await manager.listProviders();
      if (providers.includes(provider)) {
        logger.debug(`${provider} - Ingestion record found`);
        res.json({
          success: true,
          message: 'Provider is already restarting',
        });
      } else {
        res.status(404).json({
          success: false,
          message: `Provider '${provider}' not found`,
        });
      }
    }
  });

  // Stop the provider and pause it for 24 hours
  router.post('/:provider/cancel', async (req, res) => {
    const { provider } = req.params;
    const record = await manager.getCurrentIngestionRecord(provider);
    if (record) {
      const next_action_at = new Date();
      next_action_at.setTime(next_action_at.getTime() + 24 * 60 * 60 * 1000);
      await manager.updateByName(provider, {
        next_action: 'nothing (done)',
        ingestion_completed_at: new Date(),
        next_action_at,
        status: 'resting',
      });
      res.json({
        success: true,
        message: `${provider}: Current ingestion canceled.`,
      });
    } else {
      const providers: string[] = await manager.listProviders();
      if (providers.includes(provider)) {
        logger.debug(`${provider} - Ingestion record found`);
        res.json({
          success: true,
          message: 'Provider is currently restarting, please wait.',
        });
      } else {
        res.status(404).json({
          success: false,
          message: `Provider '${provider}' not found`,
        });
      }
    }
  });

  // Wipe out all ingestion records for the provider and pause for 24 hours
  router.delete('/:provider', async (req, res) => {
    const { provider } = req.params;
    const result = await manager.purgeAndResetProvider(provider);
    res.json(result);
  });

  // Get the ingestion marks for the current cycle
  router.get('/:provider/marks', async (req, res) => {
    const { provider } = req.params;
    const record = await manager.getCurrentIngestionRecord(provider);
    if (record) {
      const id = record.id;
      const records = await manager.getAllMarks(id);
      res.json({ success: true, records });
    } else {
      const providers: string[] = await manager.listProviders();
      if (providers.includes(provider)) {
        logger.debug(`${provider} - Ingestion record found`);
        res.json({
          success: true,
          message: 'No records yet (provider is restarting)',
        });
      } else {
        logger.error(
          `${provider} - No ingestion record found in the database!`,
        );
        res.status(404).json({
          success: false,
          status: {},
          last_error: `Provider '${provider}' not found`,
        });
      }
    }
  });

  router.delete('/:provider/marks', async (req, res) => {
    const { provider } = req.params;
    const deletions = await manager.clearFinishedIngestions(provider);

    res.json({
      success: true,
      message: `Expired marks for provider '${provider}' removed.`,
      deletions,
    });
  });

  router.use(errorHandler());

  return router;
};
