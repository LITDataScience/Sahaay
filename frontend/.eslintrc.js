// https://docs.expo.dev/guides/using-eslint/
module.exports = {
    extends: 'expo',
    ignorePatterns: ['/dist/*'],
    overrides: [
        {
            files: ['*.config.js', '.eslintrc.js', 'plugins/**/*.js', 'jest.setup.js'],
            env: {
                node: true,
                jest: true,
            },
        },
    ],
};
