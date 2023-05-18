module.exports = require("@backstage/cli/config/eslint-factory")(__dirname, {
  overrides: [
    {
      extends: ['plugin:prettier/recommended'],
      files: ["**/*.ts*"],
      rules: {
        "prettier/prettier": [
          "error",
          {...require('@spotify/prettier-config')},
        ],
      },
    },
  ],
});
