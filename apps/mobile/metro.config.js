// Monorepo: one React for Metro (must match react-native’s renderer) + resolution
// (https://docs.expo.dev/guides/monorepos/)
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const { existsSync } = require("fs");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");
const rootNodeModules = path.join(workspaceRoot, "node_modules");
const projectNodeModules = path.join(projectRoot, "node_modules");

/** React must be 19.1.x to match RN’s react-native-renderer (repo root may have 19.2.x for Next.js). */
function resolveReactDir() {
  const local = path.join(projectNodeModules, "react");
  if (existsSync(path.join(local, "package.json"))) {
    return local;
  }
  try {
    return path.dirname(
      require.resolve("react/package.json", { paths: [projectRoot] })
    );
  } catch {
    return path.join(rootNodeModules, "react");
  }
}

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.disableHierarchicalLookup = true;
// Mobile workspace node_modules FIRST so `react` resolves to 19.1.x, not root’s 19.2.x (web).
config.resolver.nodeModulesPaths = [projectNodeModules, rootNodeModules].filter(
  (p) => existsSync(p)
);
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  react: resolveReactDir(),
};

module.exports = config;
