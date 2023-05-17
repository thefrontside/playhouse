# scaffolder-frontend-workflow

A simple wrapper around the [@backstage/plugin-scaffolder-react Workflow](https://github.com/backstage/backstage/blob/master/plugins/scaffolder-react/src/next/components/Workflow/Workflow.tsx) that various overrides of the workflow component properties and allows a `frontPage` or `finishPage` of markup to be added.

e.g.

```tsx
<EmbeddedScaffolderWorkflow
  title="Different title than template"
  description={`
## This is markdown
- overriding the template description
    `}
  onCreate={onComplete}
  onError={onError}
  namespace="default"
  templateName="docs-template"
  initialState={{
    name: 'prefilled-name',
  }}
  extensions={[]}
  frontPage={
    <>
      <h1>Front Page to workflow</h1>
      <p>
        Security insights actionable advice to improve security posture of your
        application
      </p>
      <p>
        You must complete on-boarding process to activate security insights on
        this project.
      </p>
    </>
  }
  finishPage={
    <>
      <h1>Congratulations, this application is complete!</h1>
    </>
  }
  components={{
    ReviewStateComponent: () => (
      <h1>This is a different wrapper for the review page</h1>
    ),
    reviewButtonText: 'Changed Review button text',
    createButtonText: 'Changed Create button text',
  }}
/>
```
