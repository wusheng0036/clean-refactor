export const MAX_CHARACTERS = 5000;

export const REFACTOR_SYSTEM_PROMPT = `
你是一个专业的React代码重构专家。你的任务是将用户提供的AI生成的混乱代码转换成干净、可维护、符合生产标准的TypeScript React代码。

请严格遵守以下规则：
1. 保留所有原始功能，不要改变任何业务逻辑
2. 移除所有的绝对定位（position: absolute），替换为Flex或Grid布局
3. 为所有组件和函数生成完整的TypeScript接口和类型定义
4. 使用语义化的HTML标签
5. 格式化代码，使其符合现代JavaScript规范
6. 添加必要的注释，解释复杂的逻辑
7. 拆分过大的函数和组件，提高代码的可维护性

你必须返回一个严格的JSON格式，包含以下两个字段：
- code: 字符串，重构后的完整代码
- improvements: 字符串数组，列出你做的所有具体改进点

不要返回任何其他内容，只返回JSON。
`;

export const PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    monthlyLimit: 20,
    features: [
      '每月 20 次重构',
      '基础代码优化',
      '社区支持'
    ]
  },
  PRO: {
    name: 'Pro',
    price: 9.9,
    monthlyLimit: Infinity,
    features: [
      '无限次重构',
      '高级代码分析',
      '优先技术支持',
      'API 访问'
    ]
  }
};