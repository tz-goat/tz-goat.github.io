import stylelint from "stylelint";
import selectorParser from "postcss-selector-parser";

const {
  createPlugin,
  utils: { report, ruleMessages, validateOptions },
} = stylelint;

const ruleName = "custom/no-direct-dark-selector";

const messages = ruleMessages(ruleName, {
  rejected: ({ selector }) =>
    `Do not style dark mode with ".dark" selectors directly in "${selector}". Move dark overrides to "html[data-theme=\"dark\"]" tokens instead.`,
});

const hasDirectDarkClass = (selector) => {
  let foundDarkClass = false;

  selectorParser((selectors) => {
    selectors.walkClasses((classNode) => {
      if (classNode.value === "dark") {
        foundDarkClass = true;
      }
    });
  }).processSync(selector);

  return foundDarkClass;
};

const ruleFunction = (primary) => {
  return (root, result) => {
    const validOptions = validateOptions(result, ruleName, {
      actual: primary,
      possible: [true],
    });

    if (!validOptions) {
      return;
    }

    root.walkRules((rule) => {
      const { selector } = rule;

      if (!selector) {
        return;
      }

      if (!hasDirectDarkClass(selector)) {
        return;
      }

      report({
        ruleName,
        result,
        node: rule,
        message: messages.rejected({ selector }),
      });
    });
  };
};

export default createPlugin(ruleName, ruleFunction);
