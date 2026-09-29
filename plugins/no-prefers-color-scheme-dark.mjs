import stylelint from "stylelint";

const {
  createPlugin,
  utils: { report, ruleMessages, validateOptions },
} = stylelint;

const ruleName = "custom/no-prefers-color-scheme-dark";

const messages = ruleMessages(ruleName, {
  rejected: () =>
    'Do not use "@media (prefers-color-scheme: dark)". This project uses "html[data-theme=\"dark\"]" as the only dark-mode source.',
});

const getNormalizedParams = (str) => str.trim().toLowerCase();

const ruleFunction = (primary) => {
  return (root, result) => {
    // 校验这条规则在配置里是不是被“正确启用”，如果值不是true就不继续执行直接返回
    // 后续配置复杂化后可以调整
    const validOptions = validateOptions(result, ruleName, {
      actual: primary,
      possible: [true],
    });

    if (!validOptions) {
      return;
    }
    root.walkAtRules("media", (atRule) => {
      const normalizedParam = getNormalizedParams(atRule.params);
      if (normalizedParam.match(/^.*prefers-color-scheme\s*:\s*dark.*$/gm)) {
        report({
          ruleName,
          result,
          node: atRule,
          message: messages.rejected(),
        });
      }
    });
  };
};

export default createPlugin(ruleName, ruleFunction);
