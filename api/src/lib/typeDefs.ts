import { loadFilesSync } from '@graphql-tools/load-files';
import { mergeTypeDefs } from '@graphql-tools/merge';
import type { DocumentNode } from 'graphql';
import path from 'path';

export function getTypeDefs(): DocumentNode {
    return mergeTypeDefs(loadFilesSync(path.resolve('src/models/**/*.graphql')));
}
