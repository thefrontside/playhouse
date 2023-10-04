import React from 'react';
import { useAsyncValidation, AsyncValidationProps } from './useAsyncValidation';
import { TestApiProvider } from '@backstage/test-utils';
import { renderHook } from '@testing-library/react-hooks';
import {
  scaffolderApiRef,
  SecretsContextProvider,
} from '@backstage/plugin-scaffolder-react';
import { scaffolderApiMock } from '../test.utils';
import { FieldValidation } from '@rjsf/utils';

const createValidation = ({
  schema,
  validators,
  extensions,
}: AsyncValidationProps) => {
  const { result } = renderHook(
    () => ({
      hook: useAsyncValidation({ schema, validators, extensions }),
    }),
    {
      wrapper: ({ children }) => (
        <TestApiProvider apis={[[scaffolderApiRef, scaffolderApiMock]]}>
          <SecretsContextProvider>{children}</SecretsContextProvider>
        </TestApiProvider>
      ),
    },
  );
  return result.current.hook;
};

describe('useAsyncValidation', () => {
  /*
    Note that we are defining the extensions much like would be configured
      when using an RJSF. The two options either no-op or add an error unrelated
      to the actual formData that is passed, `value`. This means that the tests
      don't really consider the form data, and that the form's schema isn't validated
      with the asyncValidation. It is handled within RJSF and the ajv validators.
  */
  const extensions = [
    {
      name: 'TextExtensionError',
      component: () => null,
      validation: (_value: string, validation: FieldValidation) => {
        validation.addError('boop');
      },
    },
    {
      name: 'TextExtensionValidates',
      component: () => null,
      validation: (_value: string, _validation: FieldValidation) => {},
    },
  ];
  const validators = extensions.reduce((v, c) => {
    v[c.name] = c?.validation;
    return v;
  }, {} as Record<string, any>);

  it('returns empty validation object with empty schema', async () => {
    const schema = { title: 'boop', properties: {}, required: [] };
    const formData = {};
    const validation = createValidation({ schema, validators, extensions });
    const returnedValidation = await validation(formData);

    expect(returnedValidation).toEqual({});
  });

  // should this throw on an error?
  it.skip('throws errors on invalid schema', async () => {
    const schema = {
      title: 'boop',
      type: 'object',
      properties: [
        {
          blam: { type: 'bargle' },
        },
      ],
    };
    const formData = { bloop: 'boop' };
    const validation = createValidation({ schema, validators, extensions });
    const returnedValidation = await validation(formData);

    expect(returnedValidation).toEqual({});
  });

  it('validates string component', async () => {
    const schema = {
      title: 'boop',
      type: 'object',
      properties: {
        stringField: {
          title: 'boop string',
          type: 'string',
          'ui:field': 'TextExtensionError',
        },
      },
      required: ['stringField'],
    };
    const validation = createValidation({ schema, validators, extensions });
    const returnedValidation = await validation({});

    expect(returnedValidation).toEqual({
      stringField: { __errors: ['boop'] },
    });
  });

  it('validates array of single field', async () => {
    const schema = {
      title: 'boop',
      type: 'object',
      properties: {
        stringFields: {
          type: 'array',
          items: {
            type: 'string',
            'ui:field': 'TextExtensionError',
          },
        },
      },
      required: ['stringFields'],
    };
    const validation = createValidation({ schema, validators, extensions });
    const returnedValidation = await validation({});

    expect(returnedValidation).toEqual({
      stringFields: { __errors: ['boop'] },
    });
  });

  it('validates array of objects', async () => {
    const schema = {
      title: 'boop',
      type: 'object',
      properties: {
        objectFields: {
          title: 'boop',
          type: 'array',
          required: ['name'],
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                'ui:field': 'TextExtensionError',
              },
            },
          },
        },
      },
    };
    const validation = createValidation({ schema, validators, extensions });
    const returnedValidation = await validation({});

    expect(returnedValidation).toEqual({
      objectFields: { __errors: ['boop'] },
    });
  });

  it('validates open ended object component', async () => {
    const schema = {
      title: 'boop',
      type: 'object',
      properties: {
        stringField: {
          title: 'boop object',
          type: 'object',
          'ui:field': 'TextExtensionError',
        },
      },
      required: ['stringField'],
    };
    const validation = createValidation({ schema, validators, extensions });
    const returnedValidation = await validation({});

    expect(returnedValidation).not.toEqual({});

    expect(returnedValidation?.stringField?.__errors).toEqual(['boop']);
  });

  it('validates defined object component', async () => {
    const schema = {
      title: 'boop',
      type: 'object',
      properties: {
        complexField: {
          title: 'boop object',
          type: 'object',
          'ui:field': 'TextExtensionError',
          properties: {
            id: {
              type: 'integer',
              'ui:field': 'TextExtensionError',
            },
            label: {
              type: 'string',
              'ui:field': 'TextExtensionError',
            },
            required: ['id', 'label'],
          },
        },
      },
      required: ['complexField'],
    };
    const validation = createValidation({ schema, validators, extensions });
    // the formData matters here as the nested object expects the object passed down
    const returnedValidation = await validation({ complexField: {} });

    expect(returnedValidation).toEqual({
      complexField: {
        __errors: ['boop'],
        id: { __errors: ['boop'] },
        label: { __errors: ['boop'] },
      },
    });
  });

  it('validates object with references', async () => {
    const schema = {
      title: 'boop',
      definitions: {
        address: {
          type: 'object',
          'ui:field': 'TextExtensionError',
          properties: {
            street_address: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
          },
          required: ['street_address', 'city', 'state'],
        },
      },
      type: 'object',
      properties: {
        billing_address: { $ref: '#/definitions/address' },
        shipping_address: { $ref: '#/definitions/address' },
      },
      required: ['billing_address', 'shipping_address'],
    };
    const validation = createValidation({ schema, validators, extensions });
    const returnedValidation = await validation({});

    expect(returnedValidation).toEqual({
      billing_address: { __errors: ['boop'] },
      shipping_address: { __errors: ['boop'] },
    });
  });

  it('validates object with unidirectional dependencies', async () => {
    const schema = {
      title: 'boop',
      type: 'object',
      properties: {
        name: { type: 'string', 'ui:field': 'TextExtensionError' },
        credit_card: { type: 'number', 'ui:field': 'TextExtensionError' },
        billing_address: { type: 'string', 'ui:field': 'TextExtensionError' },
      },
      required: ['name'],
      dependencies: {
        credit_card: ['billing_address'],
      },
    };
    const validation = createValidation({ schema, validators, extensions });
    const returnedValidation = await validation({});

    // TODO does that dependency validate?
    expect(returnedValidation).toEqual({
      name: { __errors: ['boop'] },
      credit_card: { __errors: ['boop'] },
      billing_address: { __errors: ['boop'] },
    });
  });

  it('validates object with bidirectional dependencies', async () => {
    const schema = {
      title: 'boop',
      type: 'object',
      properties: {
        name: { type: 'string', 'ui:field': 'TextExtensionError' },
        credit_card: { type: 'number', 'ui:field': 'TextExtensionError' },
        billing_address: { type: 'string', 'ui:field': 'TextExtensionError' },
      },
      required: ['name'],
      dependencies: {
        credit_card: ['billing_address'],
        billing_address: ['credit_card'],
      },
    };
    const validation = createValidation({ schema, validators, extensions });
    const returnedValidation = await validation({});

    expect(returnedValidation).toEqual({
      name: { __errors: ['boop'] },
      credit_card: { __errors: ['boop'] },
      billing_address: { __errors: ['boop'] },
    });
  });

  it('validates object with conditional dependencies', async () => {
    const schema = {
      title: 'boop',
      type: 'object',
      properties: {
        name: { type: 'string', 'ui:field': 'TextExtensionError' },
        credit_card: { type: 'number', 'ui:field': 'TextExtensionError' },
      },
      required: ['name'],
      dependencies: {
        credit_card: {
          properties: {
            billing_address: {
              type: 'string',
              'ui:field': 'TextExtensionError',
            },
          },
          required: ['billing_address'],
        },
      },
    };
    const validation = createValidation({ schema, validators, extensions });

    const returnedValidationBeforeDep = await validation({});
    expect(returnedValidationBeforeDep).toEqual({
      name: { __errors: ['boop'] },
      credit_card: { __errors: ['boop'] },
    });

    // TODO this should pass when the formData includes the credit_card
    // const returnedValidationAfterDep = await validation({ credit_card: 12345 });
    // expect(returnedValidationAfterDep).toEqual({
    //   name: { __errors: ['boop'] },
    //   credit_card: { __errors: ['boop'] },
    //   billing_address: { __errors: ['boop'] },
    // });
  });

  it('validates ojbect with dynamic dependencies', async () => {
    const schema = {
      title: 'Person',
      type: 'object',
      properties: {
        'Any pets?': {
          type: 'string',
          'ui:field': 'TextExtensionError',
          enum: ['No', 'Yes: One', 'Yes: More than one'],
          default: 'No',
        },
      },
      required: ['Any pets?'],
      dependencies: {
        'Any pets?': {
          oneOf: [
            {
              properties: {
                'Any pets?': {
                  enum: ['No'],
                  'ui:field': 'TextExtensionError',
                },
              },
            },
            {
              properties: {
                'Any pets?': {
                  enum: ['Yes: One'],
                  'ui:field': 'TextExtensionError',
                },
                'How old is your pet?': {
                  type: 'number',
                  'ui:field': 'TextExtensionError',
                },
              },
              required: ['How old is your pet?'],
            },
            {
              properties: {
                'Any pets?': {
                  enum: ['Yes: More than one'],
                  'ui:field': 'TextExtensionError',
                },
                'Pet them?': {
                  type: 'boolean',
                  'ui:field': 'TextExtensionError',
                },
              },
              required: ['Pet them?'],
            },
          ],
        },
      },
    };
    const validation = createValidation({ schema, validators, extensions });
    const returnedValidation = await validation({});

    // TODO does the form data matter? should it?
    expect(returnedValidation).toEqual({
      'Any pets?': { __errors: ['boop'] },
      // credit_card: { __errors: ['boop'] },
      // billing_address: { __errors: ['boop'] },
    });
  });

  describe.skip('does not support custom widgets for oneOf, anyOf, and allOf', () => {
    it('validates oneOf', async () => {
      const schema = {
        title: 'boop',
        type: 'object',
        oneOf: [
          {
            properties: {
              lorem: {
                type: 'string',
                'ui:field': 'TextExtensionError',
              },
            },
            required: ['lorem'],
          },
          {
            properties: {
              ipsum: {
                type: 'string',
                'ui:field': 'TextExtensionError',
              },
            },
            required: ['ipsum'],
          },
        ],
      };
      const validation = createValidation({ schema, validators, extensions });
      const returnedValidation = await validation({});

      // TODO does the form data matter? should it?
      expect(returnedValidation).toEqual({
        // credit_card: { __errors: ['boop'] },
        // billing_address: { __errors: ['boop'] },
      });
    });

    it('validates anyOf', async () => {
      const schema = {
        title: 'boop',
        type: 'object',
        anyOf: [
          {
            properties: {
              lorem: {
                type: 'string',
              },
            },
            required: ['lorem'],
          },
          {
            properties: {
              lorem: {
                type: 'string',
              },
              ipsum: {
                type: 'string',
              },
            },
          },
        ],
      };
      const validation = createValidation({ schema, validators, extensions });
      const returnedValidation = await validation({});

      expect(returnedValidation).toEqual({
        // credit_card: { __errors: ['boop'] },
        // billing_address: { __errors: ['boop'] },
      });
    });

    it('validates allOf', async () => {
      const schema = {
        title: 'Field',
        allOf: [
          {
            type: ['string', 'boolean'],
          },
          {
            type: 'boolean',
          },
        ],
      };
      const validation = createValidation({ schema, validators, extensions });
      const returnedValidation = await validation({});

      expect(returnedValidation).toEqual({
        // credit_card: { __errors: ['boop'] },
        // billing_address: { __errors: ['boop'] },
      });
    });
  });
});
