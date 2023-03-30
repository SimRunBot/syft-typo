import type * as yargs from 'yargs';
import {
  getSchemaFolder,
  logDetail,
  logError,
  logInfo,
  logVerbose
} from '../utils';
import * as fs from 'fs';
import * as path from 'path';
import { handler as generateFromDir } from './generate';
import { generate as schemaGenerate } from '../codegen/generators/model_generator';
import { getRemoteEventShemas } from '../init/destination';
import type { AST } from '../codegen/types';
import { getEventShemas } from '../init/local';

export interface Params {
  platform: string;
  product: string;
  outDir: string;
  apikey?: string;
  remote: string;
  force: boolean;
}

export const command = 'init [platform] [product]';
export const desc = 'Initialize Syft project. Generates Event models.';
export const builder = (y: yargs.Argv): yargs.Argv => {
  return (
    y
      // .option('apikey', {
      //   describe:
      //     'Syft API key. If provided, existing events are fetched from the server',
      //   type: 'string'
      // })
      .positional('platform', {
        choices: ['web', 'mobile'] as const,
        default: 'web',
        describe: 'events are auto generated for this platform',
        type: 'string'
      })
      .positional('product', {
        choices: ['ecommerce', 'b2b'] as const,
        describe: 'events are auto generated for the product',
        type: 'string'
      })
      .option('outDir', {
        describe: 'Directory to place model files',
        default: getSchemaFolder(),
        type: 'string'
      })
  );
};

function initalizeSchemaFolder(folder: string, force: boolean): boolean {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  } else {
    if (!force) {
      logError(`:warning: Folder ${folder} exists already.`);
      logInfo('Use --force to overwrite the folder');
      return false;
    } else {
      logDetail(`--force is used. Overwriting existing ${folder}`);
    }
  }
  return true;
}

function generateSchemasFrom(ast: AST, folder: string): void {
  logVerbose(`Output dir: ${folder}`);
  // generate basic assets.
  const lintRules = path.join(folder, 'lint/rules');
  if (!fs.existsSync(lintRules)) {
    fs.mkdirSync(lintRules, { recursive: true });
  }
  // recursively copy files from one folder to another.
  fs.copyFileSync(
    path.join(__dirname, '../../assets/config.ts'),
    path.join(folder, 'config.ts')
  );
  fs.copyFileSync(
    path.join(__dirname, '../../assets/lint/config.cjs'),
    path.join(folder, 'lint/config.cjs')
  );
  fs.copyFileSync(
    path.join(__dirname, '../../assets/lint/rules/required_syft_fields.js'),
    path.join(folder, 'lint/rules/required_syft_fields.js')
  );
  fs.copyFileSync(
    path.join(__dirname, '../../assets/lint/rules/required_tsdoc.js'),
    path.join(folder, 'lint/rules/required_tsdoc.js')
  );
  schemaGenerate(ast, folder);
  logInfo(`:sparkles: Models are generated successfully!`);
}

async function runSyftGenerator(outDir: string): Promise<void> {
  await generateFromDir({ input: outDir, type: 'ts' });
}

export async function handler({
  platform,
  product,
  outDir,
  apikey,
  remote,
  force
}: Params): Promise<void> {
  logVerbose(`Initializing Syft in ${outDir}..`);
  let ast: AST;
  if (apikey !== undefined) {
    logVerbose(`Syncing from ${remote}`);
    ast = await getRemoteEventShemas(remote, apikey);
  } else {
    logVerbose(`Generating models for ${platform}`);
    ast = getEventShemas(platform, product);
  }

  // add useridentity, groupidentity

  if (!initalizeSchemaFolder(outDir, force)) {
    logVerbose("Couldn't create the syft folder. Exiting..");
    return;
  }
  generateSchemasFrom(ast, outDir);
  logInfo(':heavy_check_mark: Syft folder is created.');
  if (process.env.NODE_ENV !== 'test') {
    await runSyftGenerator(outDir);
  }
}
