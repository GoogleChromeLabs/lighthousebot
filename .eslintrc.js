module.exports = {
  // start with google standard style
  //     https://github.com/google/eslint-config-google/blob/master/index.js
  "extends": ["eslint:recommended", "google"],
  "env": {
    "node": true,
    "es6": true,
    "browser": true,
    "jest": true,
  },
  "parserOptions": {
    "ecmaVersion": 8,
    "ecmaFeatures": {
      "jsx": false,
      "experimentalObjectRestSpread": false
    },
    "sourceType": "script"
  },
  "rules": {
    // 2 == error, 1 == warning, 0 == off
    "indent": [2, 2, {
      "SwitchCase": 1,
      "VariableDeclarator": 2
    }],
    "max-len": [2, 100, {
      "ignoreComments": true,
      "ignoreUrls": true,
      "tabWidth": 2
    }],
    "no-empty": [2, {
      "allowEmptyCatch": true
    }],
    "no-implicit-coercion": [2, {
      "boolean": false,
      "number": true,
      "string": true
    }],
    "no-unused-expressions": [2, {
      "allowShortCircuit": true,
      "allowTernary": false
    }],
    "no-unused-vars": [2, {
      "vars": "all",
      "args": "after-used",
      "argsIgnorePattern": "(^reject$|^_$)",
      "varsIgnorePattern": "(^_$)"
    }],
    "quotes": [2, "single"],
    "strict": [2, "global"],
    "prefer-const": 2,

    // Disabled rules
    "require-jsdoc": 0,
    "valid-jsdoc": 0,
    "comma-dangle": 0,
    "arrow-parens": 0,
    "no-console": 0
  }
}
