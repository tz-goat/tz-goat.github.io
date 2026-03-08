import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",  // 启用静态导出
  basePath: "",      // 如果是 https://username.github.io/ 则留空；如果是项目仓库改为 "/repo-name"
};

export default nextConfig;