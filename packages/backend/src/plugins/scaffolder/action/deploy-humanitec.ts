import { createTemplateAction } from '@backstage/plugin-scaffolder-backend';

export const deployHumanitec = () => {
  return createTemplateAction<{ image_tag: string }>({
    id: 'mycompany:second-action',
    schema: {
      input: {
        required: ['image_tag'],
        type: 'object',
        properties: {
          image_tag: {
            type: 'string',
            title: 'image_tag',
            description: 'whatever',
          },
        },
      }
    },
    async handler(ctx) {
      console.log(ctx.input.image_tag);     
    },
  });
};
