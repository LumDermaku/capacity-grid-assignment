import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
    overwrite: true,
    schema: './src/models/**/*.graphql',
    generates: {
        'src/generated/graphql.ts': {
            plugins: ['typescript', 'typescript-resolvers'],
            config: {
                contextType: '../lib/context#GraphQLContext',
                scalars: { Date: 'string' },
            },
        },
        '../web/app/graphql/generated/graphql.ts': {
            plugins: ['typescript', 'typescript-operations', 'typed-document-node'],
            documents: '../web/app/graphql/operations/**/*.graphql',
            config: {
                scalars: { Date: 'string' },
                onlyOperationTypes: true,
                nonOptionalTypename: true,
                skipTypeNameForRoot: true,
            },
        },
    },
};

export default config;
