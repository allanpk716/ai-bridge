import { useState, useEffect, useRef, FormEvent } from 'react';
import { AIBridgeSDK, ConnectionState } from '@ai-bridge/sdk';
import type { MessageResponse } from '@ai-bridge/sdk';

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sdkRef = useRef<AIBridgeSDK | null>(null);

  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.CONNECTING
  );
  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
  }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // 创建 SDK 实例
    const sdk = new AIBridgeSDK({
      url: 'http://localhost:3000',
      targetOrigin: 'http://localhost:3000',
      context: {
        theme: 'light',
        locale: 'zh-CN',
      },
      containerStyle: {
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
      },
      onStateChange: (state) => {
        setConnectionState(state);
      },
      onMessage: (message: MessageResponse) => {
        if (message.success && message.content) {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: message.content! },
          ]);
          setLoading(false);
        }
      },
      onError: (error) => {
        console.error('SDK Error:', error);
        setLoading(false);
      },
    });

    // 添加到 DOM
    containerRef.current.appendChild(sdk.iframe);
    sdkRef.current = sdk;

    // 清理
    return () => {
      sdk.destroy();
    };
  }, []);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !sdkRef.current || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // 添加用户消息
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

    try {
      await sdkRef.current.sendMessage(userMessage);
    } catch (error) {
      console.error('Send error:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '发送失败,请重试' },
      ]);
      setLoading(false);
    }
  };

  const getConnectionStatusBadge = () => {
    switch (connectionState) {
      case ConnectionState.CONNECTING:
        return <span className="status status-connecting">连接中...</span>;
      case ConnectionState.CONNECTED:
        return <span className="status status-connected">已连接</span>;
      case ConnectionState.DISCONNECTED:
        return <span className="status status-disconnected">已断开</span>;
      case ConnectionState.ERROR:
        return <span className="status status-error">错误</span>;
    }
  };

  return (
    <div className="app">
      <header>
        <h1>AI-Bridge SDK React 示例</h1>
        {getConnectionStatusBadge()}
      </header>

      <main>
        <div className="chat-section">
          <div className="messages">
            {messages.length === 0 ? (
              <div className="empty-state">
                开始与 AI-Bridge 对话吧!
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`message message-${msg.role}`}>
                  <div className="message-content">{msg.content}</div>
                </div>
              ))
            )}
            {loading && <div className="message message-assistant loading">AI 正在思考...</div>}
          </div>

          <form onSubmit={handleSend} className="input-form">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入消息..."
              disabled={loading || connectionState !== ConnectionState.CONNECTED}
            />
            <button
              type="submit"
              disabled={loading || connectionState !== ConnectionState.CONNECTED || !input.trim()}
            >
              发送
            </button>
          </form>
        </div>

        <div className="iframe-section">
          <h2>嵌入的 AI-Bridge</h2>
          <div ref={containerRef} className="iframe-container"></div>
        </div>
      </main>

      <style>{`
        .app {
          font-family: system-ui, sans-serif;
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
        }

        header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .status {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 14px;
        }

        .status-connecting { background: #fef3c7; color: #92400e; }
        .status-connected { background: #d1fae5; color: #065f46; }
        .status-disconnected { background: #f3f4f6; color: #374151; }
        .status-error { background: #fee2e2; color: #991b1b; }

        main {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .chat-section {
          display: flex;
          flex-direction: column;
          height: 600px;
        }

        .messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          background: #f9fafb;
          border-radius: 8px;
          margin-bottom: 16px;
        }

        .empty-state {
          text-align: center;
          color: #6b7280;
          padding: 40px;
        }

        .message {
          margin-bottom: 12px;
          display: flex;
        }

        .message-user {
          justify-content: flex-end;
        }

        .message-content {
          max-width: 70%;
          padding: 10px 14px;
          border-radius: 8px;
        }

        .message-user .message-content {
          background: #3b82f6;
          color: white;
        }

        .message-assistant .message-content {
          background: white;
          border: 1px solid #e5e7eb;
        }

        .message.loading .message-content {
          opacity: 0.7;
        }

        .input-form {
          display: flex;
          gap: 8px;
        }

        .input-form input {
          flex: 1;
          padding: 10px 14px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
        }

        .input-form button {
          padding: 10px 20px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }

        .input-form button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .iframe-section {
          height: 600px;
        }

        .iframe-section h2 {
          margin: 0 0 16px 0;
        }

        .iframe-container {
          height: calc(100% - 40px);
        }
      `}</style>
    </div>
  );
}

export default App;
