# 参与贡献

感谢帮助改进 Seedance Workflow。

## 提交问题前

1. 确认问题发生在当前支持版本；
2. 搜索已有 Issue，避免重复；
3. 删除 API Key、客户素材、私有剧本和个人信息；
4. 区分产品建议、普通缺陷和安全问题。安全问题请遵循 `SECURITY.md`。

## 提交改动

- UI 文案必须面向创作者，避免暴露 Skill、路由、字段合并等内部术语；
- 不得在代码、示例、截图或测试数据中提交真实 API Key；
- 修改静态前端后运行 `bash scripts/verify_release.sh`；
- 涉及 Skill 的改动需保持各模块职责边界，并提供可复现的输入与预期结果；
- 涉及隐私或外发数据变化时同步更新 `PRIVACY.md` 和 `CHANGELOG.md`。

