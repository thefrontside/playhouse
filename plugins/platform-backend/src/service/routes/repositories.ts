import type { CatalogClient } from '@backstage/catalog-client'; 
import type { Entity } from '@backstage/catalog-model';
import { Handler } from 'express';
import CliTable3 from 'cli-table3';
import chalk  from 'chalk';

export const RepositoriesRoute = ({ catalog }: { catalog: CatalogClient }) => {
  const repositoriesRoute: Handler = async (req, res) => {
    const { items: entities } = await catalog.getEntities();

    const repositories = entities.flatMap(entity => {
      const slug = entity.metadata
        && entity.metadata.annotations
        && entity.metadata.annotations["github.com/project-slug"];
      if (slug) {
        return [{
          componentRef: getComponentRef(entity),
          slug,
          description: entity.metadata.description,
          url: `https://github/${slug}`,
          ssh: `git@github.com:${slug}.git`,
          https: `https://github/${slug}.git`
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

    return repositoriesRoute;
  }
  return repositoriesRoute;
}

function getComponentRef(entity: Entity) {
  return [
    entity.kind !== 'Component' ? entity.kind.toLowerCase() : '',
    entity.metadata.namespace && entity.metadata.namespace !== 'default' ? entity.metadata.namespace : '',
    entity.metadata.name
  ].join('')
}