import { createCommand } from 'commander';


const program = createCommand('graphgen');

program
  .description('generate backstage graphgen simulated data')
  .option('-f, --file', 'backstage app-config.yaml file with locations', false)
  .parse(process.argv)
  .action(async function ({ file }) {
    try {
      console.log(file);

      console.info('finished');
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  })
  .parse(process.argv);
