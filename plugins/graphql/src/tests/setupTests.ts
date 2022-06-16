import { Entity, stringifyEntityRef } from '@backstage/catalog-model';
import type { CatalogApi } from '../app/types';
import type { JsonObject } from '@backstage/types';
import type { Operation } from 'effection';

import assert from 'assert/strict';

import { PromiseOrValue } from '@envelop/core';
import { createApp } from '..';

import { Graph, Factory, createFactory } from './factory';

export type { Graph } from './factory';

export interface GraphQLAPI {
  query(query: string): Operation<JsonObject>;
}

export type GraphQLHarness = GraphQLAPI & Factory;

export function createGraphQLAPI(): GraphQLHarness {
  let factory = createFactory();
  let app = createApp(createSimulatedCatalog(factory.graph));

  function query(query: string): Operation<JsonObject> {
    return function* Query() {
      const { parse, validate, contextFactory, execute, schema } = app();
      let document = parse(`{ ${query} }`);
      let errors = validate(schema, document);
      if (errors.length) {
        throw errors[0];
      }
      let contextValue = yield* unwrap(contextFactory());

      let result = yield* unwrap(execute({
        schema,
        document,
        contextValue,
      }));
      if (result.errors) {
        throw result.errors[0];
      } else {
        return result.data as JsonObject
      }
    }
  }
  return { ...factory, query };
}

export function createSimulatedCatalog(graph: Graph): CatalogApi {
  return {
    async getEntityByRef(ref: string) {
      for (let vertex of Object.values(graph.vertices)) {
        const { data } = vertex;
        let cmp = stringifyEntityRef({
          kind: vertex.type,
          name: data.name
        });

        if (ref === cmp) {
          let entity = {
            kind: vertex.type,
            apiVersion: 'backstage.io/v1beta1',
            metadata: {
              name: data.name,
              namespace: 'default',
              description: data.description,
            },
          } as Entity;
          if (entity.kind === 'Component') {
            let [ownerEdge] = (graph.from[vertex.id] ?? []);
            assert(ownerEdge, "every Component must have an owner");
            let ownerVertex = graph.vertices[ownerEdge.to];
            assert(ownerVertex, "every Component must have an owner");

            let ownerData = ownerVertex.data;

            return {
              ...entity,
              spec: {
                type: data.type,
                lifecycle: data.lifecycle,
              },
              relations: [{
                type: 'ownedBy',
                targetRef: stringifyEntityRef({
                  kind: ownerVertex.type,
                  name: ownerData.name,
                }),
              }]
            }
          } else if (entity.kind === 'Group') {
            return {
              ...entity,
              spec: {
                profile: {
                  displayName: vertex.data.displayName,
                  email: vertex.data.email,
                  picture: vertex.data.picture,
                }
              }
            }
          } else {
            return entity;
          }
        }
      }
      return void 0;
    }
  };
}

function isPromise<T>(x: PromiseOrValue<T>): x is Promise<T> {
  return typeof (x as Promise<T>).then === 'function';
}

function* unwrap<T>(promiseOrValue: PromiseOrValue<T> | Operation<T>): {[Symbol.iterator](): Iterator<Operation<T>, T, any> } {
  if (isPromise(promiseOrValue)) {
    return yield promiseOrValue;
  } else {
    return promiseOrValue;
  }
}
