import { Entity, EntityRelation, stringifyEntityRef } from '@backstage/catalog-model';
import type { CatalogApi } from '../app/types';
import type { JsonObject } from '@backstage/types';
import type { Operation } from 'effection';

import { strict as assert } from 'assert';

import { PromiseOrValue } from '@envelop/core';
import { createApp } from '..';

import { Graph, Factory, createFactory } from './factory';
import { Vertex } from '@frontside/graphgen';

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

            return {
              ...entity,
              spec: {
                type: data.type,
                lifecycle: data.lifecycle,
              },
              relations: [
                relation('Component.owner', 'from', 'ownedBy', vertex, graph),
                relation('Component.system', 'from', 'partOf', vertex, graph),
                relation('Component.subComponents', 'from', 'hasPart', vertex, graph),
                relation('Component.consumes', 'from', 'consumesApi', vertex, graph),
                relation('Component.provides', 'from', 'providesApi', vertex, graph),
              ],
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
          } else if (entity.kind === 'API') {
            return {
              ...entity,
              relations: [
                relation('Component.consumes', 'to', 'apiConsumedBy', vertex, graph),
                relation('Component.provides', 'to', 'apiProvidedBy', vertex, graph),
              ]
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

function relation(name: string, direction: 'from' | 'to', type: string, vertex: Vertex, graph: Graph): EntityRelation {
  let [edge] = (graph[direction][vertex.id] ?? []).filter((edge) => edge.type === name);
  assert(edge, `unable to find edge ${direction} ${vertex.type}`);

  let target = graph.vertices[edge[direction === 'from' ? 'to' : 'from']];
  assert(target, "dangling edge");

  return {
    type,
    targetRef: stringifyEntityRef({
      kind: target.type,
      name: target.data.name,
    })
  }
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
