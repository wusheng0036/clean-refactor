"use client";

import { useState } from "react";
import { Editor } from "@monaco-editor/react";

export default function CodeEditor() {
  const [input, setInput] = useState("// 在这里输入你的代码\nfunction test() {\n}");
  const [output, setOutput] = useState("// AI 重构结果将在这里显示");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // 模拟 AI 重构（等你需要时，我帮你一键接入 Gemini）
  async function handleRefactor() {
    if (!input.trim()) {
      setMessage("请输入代码");
      return;
    }

    setLoading(true);
    setMessage("AI 正在分析并重构代码...");
    setOutput("");

    try {
      // 这里未来会调用真实 Gemini API
      await new Promise(r => setTimeout(r, 1600));
      setOutput(`// 重构完成 ✅
// 优化内容：
// 1. 规范化命名
// 2. 添加类型与注释
// 3. 简化逻辑、提升可读性
// 4. 移除无用代码

function test() {
  // 业务逻辑
}`);
      setMessage("重构完成！");
    } catch (e) {
      setMessage("重构失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  // 一键复制
  function copyOutput() {
    navigator.clipboard.writeText(output);
    setMessage("已复制到剪贴板");
    setTimeout(() => setMessage(""), 1500);
  }

  // 清空输入
  function clearInput() {
    setInput("");
    setMessage("已清空输入");
    setTimeout(() => setMessage(""), 1500);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* 提示消息 */}
      {message && (
        <div style={{
          textAlign: "center",
          color: "#38bdf8",
          fontWeight: 500
        }}>
          {message}
        </div>
      )}

      {/* 双编辑器 */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "1.25rem"
      }}>
        {/* 输入 */}
        <div style={{
          background: "#1e293b",
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid #334155"
        }}>
          <div style={{
            padding: "0.75rem 1rem",
            borderBottom: "1px solid #334155",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <span style={{ fontWeight: 600 }}>输入代码</span>
            <button
              onClick={clearInput}
              style={{
                background: "#475569",
                color: "#fff",
                padding: "0.25rem 0.75rem",
                borderRadius: 6,
                fontSize: "0.85rem"
              }}
            >
              清空
            </button>
          </div>
          <Editor
            height="460px"
            language="typescript"
            theme="vs-dark"
            value={input}
            onChange={v => setInput(v || "")}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: "on",
              wordWrap: "on",
              scrollBeyondLastLine: false,
            }}
          />
        </div>

        {/* 输出 */}
        <div style={{
          background: "#1e293b",
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid #334155"
        }}>
          <div style={{
            padding: "0.75rem 1rem",
            borderBottom: "1px solid #334155",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <span style={{ fontWeight: 600 }}>重构结果</span>
            <button
              onClick={copyOutput}
              disabled={!output}
              style={{
                background: "#2563eb",
                color: "#fff",
                padding: "0.25rem 0.75rem",
                borderRadius: 6,
                fontSize: "0.85rem"
              }}
            >
              复制
            </button>
          </div>
          <Editor
            height="460px"
            language="typescript"
            theme="vs-dark"
            value={output}
            options={{ readOnly: true }}
          />
        </div>
      </div>

      {/* 重构按钮 */}
      <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
        <button
          onClick={handleRefactor}
          disabled={loading}
          style={{
            background: "#2563eb",
            color: "#fff",
            fontSize: "1rem",
            fontWeight: 600,
            padding: "0.9rem 2.25rem",
            borderRadius: 10,
            minWidth: "180px"
          }}
        >
          {loading ? "重构中..." : "开始 AI 重构"}
        </button>
      </div>
    </div>
  );
}