module.exports = {
    root: true,

    env: {
        node: true
    },

    extends: [
        '@vue/airbnb',
        'plugin:vue/essential'
    ],

    parserOptions: {
        parser: '@typescript-eslint/parser'
    },

    rules: {
        'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'semi': [2, 'never'],
        'comma-dangle': [2, 'never'],
        'indent': [2, 4],
        'vue/script-indent': ['error', 4, { 'baseIndent': 1 }],
        'quote-props': 'off',
        'func-names': 'off',
        'max-len': 'off',
        'object-curly-spacing': 'off',
        'object-curly-newline': 'off',
        'import/extensions': 'off',
        'no-underscore-dangle': 'off',
        'prefer-promise-reject-errors': 'off',
        'arrow-parens': 'off',
        'object-shorthand': 'off',
        'no-plusplus': 'off',
        'no-param-reassign': 'off',
        'no-mixed-operators': 'off',
        'prefer-destructuring': 'off',
        'no-lonely-if': 'off'
    },

    overrides: [
        {
            files: [
                '**/__tests__/*.{j,t}s?(x)',
                '**/tests/unit/**/*.spec.{j,t}s?(x)'
            ],
            env: {
                jest: true
            }
        },
        {
            'files': ['*.vue'],
            'rules': {
                'indent': 'off'
            }
        }
    ],

    'extends': [
        '@vue/airbnb',
        'plugin:vue/essential',
        '@vue/typescript'
    ]
}
