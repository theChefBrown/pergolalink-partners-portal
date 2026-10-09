import { registerHooks } from "node:module";
// Match the bundler's extensionless local TypeScript resolution in Node tests.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      specifier.startsWith(".") &&
      context.parentURL?.includes("/src/") &&
      !/\.[a-z]+$/.test(specifier)
    )
      return nextResolve(specifier + ".ts", context);
    return nextResolve(specifier, context);
  },
});
