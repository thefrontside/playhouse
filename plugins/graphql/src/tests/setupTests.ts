import { Entity, EntityRelation, stringifyEntityRef } from '@backstage/catalog-model';
import type { CatalogApi } from '../app/types';
import type { JsonObject } from '@backstage/types';
import type { Operation } from 'effection';
import type { Node } from '@frontside/graphgen';

import { strict as assert } from 'assert';

import { PromiseOrValue } from '@envelop/core';
import { createApp } from '..';

import { Factory, World, createFactory, Component } from './factory';

export interface GraphQLHarness {
  query(query: string): Operation<JsonObject>;
  create(...params: Parameters<Factory["create"]>): string;
}



export function createGraphQLAPI(): GraphQLHarness {
  let factory = createFactory();
  let app = createApp(createSimulatedCatalog(factory));


  return {
    query(query: string): Operation<JsonObject> {
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
    },
    create(...params) {
      let node = factory.create(...params);
      return stringifyEntityRef({
        kind: node.__typename,
        name: node.name
      });
    }
  };
}

export function createSimulatedCatalog(factory: Factory): CatalogApi {
  return {
    async getEntityByRef(ref: string) {
      let all = concat<Node & World[keyof World]>(
        factory.all('Group'),
        factory.all('Component'),
        factory.all('System'),
        factory.all('API'),
      );
      for (let node of all) {
        let { __typename: kind, name } = node;

        let cmp = stringifyEntityRef({ kind, name });
        if (ref === cmp) {
          return nodeToEntity(node);
        }
      }
      return void 0;
    }
  }
}

function *concat<T>(...iterables: Iterable<T>[]): Iterable<T> {
  for (let iterable of iterables) {
    yield* iterable;
  }
}

export function nodeToEntity(node: Node & World[keyof World]): Entity {
  let { name, __typename: kind } = node;
  let entity = {
    kind,
    apiVersion: 'backstage.io/v1beta1',
    metadata: {
      name,
      namepsace: 'default',
      description: node.description,
    }
  } as Entity;
  if (node.__typename === "Component") {
      let component = node as Node & Component;
      let { type, lifecycle } = component;
      return {
        ...entity,
        spec: { type, lifecycle },
        relations: relations({
          ownedBy: component.owner,
          partOf: component.system,
          subComponents: component.subComponents,
          consumesApi: component.consumes,
          providesApi: component.provides,
        }),
      }
  } else if (kind === "Group") {
      let group = node as World["Group"];
      let { displayName, email, picture } = group;
      return {
        ...entity,
        spec: {
          profile: {
            displayName,
            email,
            picture,
          }
        }
      }
  } else if (kind === "API") {
    let api = node as World["API"];
    return {
      ...entity,
      relations: relations({
        apiConsumedBy: api.consumedBy,
        apiProvidedBy: api.providedBy,
      })
    };
  } else if (kind === "System") {
    return entity;
  } else {
    throw new Error(`don't know how to convert node: '${kind}/${node.id}' into an Entity`);
  }
}

export function relations(map: Record<string, World[keyof World] | World[keyof World][]>): EntityRelation[] {
  return Object.entries(map).reduce((relations, [type, content]) => {
    let targets = Array.isArray(content) ? content : [content];
    return relations.concat(targets.map(node => ({
      type,
      targetRef: stringifyEntityRef(nodeToEntity(node as Node & World[keyof World]))
    })));
  }, [] as EntityRelation[]);
}

function isPromise<T>(x: PromiseOrValue<T>): x is Promise<T> {
  return typeof (x as Promise<T>).then === 'function';
}

function* unwrap<T>(promiseOrValue: PromiseOrValue<T> | Operation<T>): {[Symbol.iterator](): Iterator<Operation<T>, T, any> } {
  if (isPromise(promiseOrValue)) {
    return yield promiseOrValue;
  } else {
    return promiseOrValue as T;
  }
}
