import type { CatalogClient } from '@backstage/catalog-client'; 
import type { Entity } from '@backstage/catalog-model';
import CliTable3 from 'cli-table3';
import chalk  from 'chalk';
import Router from 'express-promise-router';

export const Repositories = ({ catalog }: { catalog: CatalogClient }) => {
  const router = Router();

  router.get('/', async (req, res) => {
    const { items: entities } = await catalog.getEntities();

    const repositories = entities.flatMap(entity => {
      const slug = getGithubProjectSlug(entity);
      if (slug) {
        return [{
          componentRef: getComponentRef(entity),
          slug,
          description: entity.metadata.description,
          url: `https://github/${slug}`,
        }]
      }
      return [];
    });

    if (req.accepts('json')) {
      res.json(repositories);
    } else {
      const table = new CliTable3({
        head: ['Component', 'Repository URL', 'Description']
      });
      table.push(
        ...repositories.map(r => ([r.componentRef, r.url, r.description]))
      )
      res.send(`\n${chalk.bold('  🥁 Available Repositories')}\n${table}`)
    }

    return router;
  });

  router.get('/:component/urls', async (req, res) => {
    const entity = await catalog.getEntityByRef({
      kind: 'Component',
      namespace: 'default',
      name: req.params.component
    });
    if (entity) {
      const slug = getGithubProjectSlug(entity);
      res.json({
        ssh: `git@github.com:${slug}.git`,
        https: `https://github/${slug}.git`
      })
      return;
    }
    res.sendStatus(404);
    res.send("Not Found");
  });

  
  return router;
}

function getGithubProjectSlug(entity: Entity) {
  return entity.metadata
    && entity.metadata.annotations
    && entity.metadata.annotations["github.com/project-slug"];
}

function getComponentRef(entity: Entity) {
  return [
    entity.kind !== 'Component' ? entity.kind.toLowerCase() : '',
    entity.metadata.namespace && entity.metadata.namespace !== 'default' ? entity.metadata.namespace : '',
    entity.metadata.name
  ].join('')
}