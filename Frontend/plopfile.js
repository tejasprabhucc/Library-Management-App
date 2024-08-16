export default function (plop) {
  plop.setGenerator("component", {
    description: "Generate a React component",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "Component name:",
      },
    ],
    actions: [
      {
        type: "add",
        path: "src/components/{{pascalCase name}}/{{pascalCase name}}.tsx",
        templateFile: "plop-templates/Component.tsx.hbs",
      },
      {
        type: "add",
        path: "src/components/{{pascalCase name}}/{{pascalCase name}}.stories.ts",
        templateFile: "plop-templates/Component.stories.ts.hbs",
      },
    ],
  });
}
