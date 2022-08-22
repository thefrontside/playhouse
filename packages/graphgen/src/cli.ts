#!/usr/bin/env node
'use strict';

import { createCommand } from 'commander';
import { parseLocations } from './location-parser';


const program = createCommand('graphgen');

program
  .name("graphgen-cli")
  .description(`CLI to graphgen goodness.
  commands:
    -- backstage-data
  `)

program.command('backstage-data')
  .description('generate backstage graphgen simulated data')
  .option('-f, --file <string>', 'backstage app-config.yaml file with locations')
  .option('-d', '--directory <string>', 'The directory to find paths related to a package.  Arg will be passed to backstage findPaths.')
  .parse(process.argv)
  .action(async function ({ file, directory }) {
    try {
      await parseLocations({ file, directory })
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  })
  .parse(process.argv);
