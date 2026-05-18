import { loadConfig, saveConfig, getNestedKey, maskConfig } from '../../config/loader';
import { ConfigScope } from '../../config/types';

export function configShowCommand(): void {
  const config = loadConfig();
  const masked = maskConfig(config);
  console.log(JSON.stringify(masked, null, 2));
}

export function configGetCommand(key: string): void {
  const config = loadConfig();
  const value = getNestedKey(config, key);
  if (value === undefined) {
    console.error(`Key not found: ${key}`);
    process.exit(1);
  }
  console.log(String(value));
}

export function configSetCommand(key: string, value: string, options: { global?: boolean }): void {
  const scope: ConfigScope = options.global ? 'global' : 'local';
  saveConfig(scope, key, value);
  console.log(`Set ${key} = ${value} (${scope})`);
}
