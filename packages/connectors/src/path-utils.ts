import * as path from "node:path";

function configuredBaseDir(): string {
  return process.env.TRAITMIXER_APP_ROOT || process.env.INIT_CWD || process.cwd();
}

export function resolveConfiguredPath(filePath: string): string {
  if (filePath.startsWith("~/")) {
    return path.join(process.env.HOME ?? "/root", filePath.slice(2));
  }

  if (path.isAbsolute(filePath)) {
    return filePath;
  }

  return path.resolve(configuredBaseDir(), filePath);
}
