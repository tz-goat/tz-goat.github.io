import stylelint from "stylelint";
import valueParser from "postcss-value-parser";

const {
  createPlugin,
  utils: { report, ruleMessages, validateOptions },
} = stylelint;

const ruleName = "custom/no-raw-color-outside-theme";

const messages = ruleMessages(ruleName, {
  rejected: ({ selector, property, value }) =>
    `Unexpected raw color in "${selector}":{ "${property}: ${value}" }. Use theme tokens instead.`,
});

const ALLOWED_SELECTORS = [":root", 'html[data-theme="dark"]'];

const hasRawColorLiteral = (value) => {
  const parsed = valueParser(value);
  let hasHardColor = false;
  parsed.walk((node) => {
    if (node.type === "word") {
      // 匹配 `#fff`（3 位）、`#ffffff`（6 位）十六进制颜色
      if (/^#(?:[\da-fA-F]{3}){1,2}$/.test(node.value)) {
        hasHardColor = true;
      }
    }
    if (node.type === "function") {
      if (/^(rgb|rgba|hsl|hsla)$/.test(node.value.toLowerCase())) {
        hasHardColor = true;
      }
    }
  });
  return hasHardColor;
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
    // 这里有rule Node， 还有declNode
    root.walkDecls((decl) => {
      // 1. 拿 selector
      const parent = decl.parent;
      if (parent?.type !== "rule") {
        return;
      }
      const { selector } = parent;
      // 2. 如果在允许区，return
      const normalizeSelector = selector.trim();
      if (ALLOWED_SELECTORS.includes(normalizeSelector)) {
        return;
      }
      // 3. 如果 value 里有原始颜色，执行report报错
      if (hasRawColorLiteral(decl.value)) {
        report({
          ruleName,
          result,
          node: decl,
          message: messages.rejected({
            selector,
            property: decl.prop,
            value: decl.value,
          }),
        });
      }
    });
  };
};
export default createPlugin(ruleName, ruleFunction);
