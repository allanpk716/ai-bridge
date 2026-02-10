import { z as s } from "zod";
class f {
  constructor(e) {
    this.iframe = null, this.config = e;
  }
  /**
   * 创建并返回 iframe 元素
   */
  createIframe() {
    return this.iframe = document.createElement("iframe"), this.iframe.src = this.buildIframeUrl(), this.iframe.style.border = "none", this.iframe.style.width = "100%", this.iframe.style.height = "100%", this.iframe.style.overflow = "hidden", this.config.containerStyle && Object.assign(this.iframe.style, this.config.containerStyle), this.iframe.setAttribute("sandbox", "allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"), this.iframe;
  }
  /**
   * 构建 iframe URL(包含上下文参数)
   */
  buildIframeUrl() {
    const e = new URL(this.config.url);
    return this.config.context && (this.config.context.sessionId && e.searchParams.set("sessionId", this.config.context.sessionId), this.config.context.theme && e.searchParams.set("theme", this.config.context.theme), this.config.context.locale && e.searchParams.set("locale", this.config.context.locale)), e.searchParams.set("embed", "true"), e.toString();
  }
  /**
   * 获取 iframe 的 contentWindow
   */
  getContentWindow() {
    return this.iframe?.contentWindow ?? null;
  }
  /**
   * 等待 iframe 加载完成
   */
  async waitForLoad() {
    if (!this.iframe)
      throw new Error("Iframe not created");
    return new Promise((e, t) => {
      const n = setTimeout(() => {
        t(new Error("Iframe load timeout"));
      }, 1e4);
      this.iframe.addEventListener("load", () => {
        clearTimeout(n), e();
      }, { once: !0 });
    });
  }
  /**
   * 销毁 iframe
   */
  destroy() {
    this.iframe && (this.iframe.remove(), this.iframe = null);
  }
  /**
   * 获取 iframe 元素(用于挂载到 DOM)
   */
  getIframe() {
    return this.iframe;
  }
}
const u = s.object({
  text: s.string().min(1).max(1e4),
  sessionId: s.string().optional(),
  context: s.record(s.string(), s.any()).optional()
}), b = s.object({
  messageId: s.string(),
  success: s.boolean(),
  content: s.string().optional(),
  error: s.string().optional(),
  metadata: s.object({
    model: s.string(),
    tokensUsed: s.number(),
    duration: s.number().optional()
  }).optional()
}), y = s.discriminatedUnion("type", [
  s.object({
    type: s.literal("init"),
    payload: s.object({
      sessionId: s.string().optional(),
      theme: s.enum(["light", "dark"]).optional(),
      locale: s.string().optional()
    })
  }),
  s.object({
    type: s.literal("sendMessage"),
    payload: u.extend({
      messageId: s.string()
    })
  }),
  s.object({
    type: s.literal("disconnect")
  })
]), E = s.discriminatedUnion("type", [
  s.object({
    type: s.literal("ready")
  }),
  s.object({
    type: s.literal("messageResponse"),
    payload: b
  }),
  s.object({
    type: s.literal("error"),
    payload: s.object({
      message: s.string(),
      code: s.string().optional()
    })
  }),
  s.object({
    type: s.literal("heartbeatAck"),
    payload: s.object({
      timestamp: s.number().optional()
    })
  })
]);
class I {
  constructor(e) {
    this.messageQueue = /* @__PURE__ */ new Map(), this.messageId = 0, this.messageHandler = null, this.isListening = !1, this.config = e;
  }
  /**
   * 启动桥接器
   */
  start() {
    this.isListening || (this.messageHandler = this.handleMessage.bind(this), window.addEventListener("message", this.messageHandler), this.isListening = !0);
  }
  /**
   * 停止桥接器
   */
  stop() {
    this.isListening && (this.messageHandler && (window.removeEventListener("message", this.messageHandler), this.messageHandler = null), this.messageQueue.forEach(({ timeout: e, reject: t }) => {
      clearTimeout(e), t(new Error("Bridge stopped"));
    }), this.messageQueue.clear(), this.isListening = !1);
  }
  /**
   * 处理来自 iframe 的消息
   */
  handleMessage(e) {
    if (e.origin === this.config.targetOrigin)
      try {
        const t = E.parse(e.data);
        if (this.config.onMessage(t), t.type === "messageResponse") {
          const n = this.messageQueue.get(t.payload.messageId);
          n && (clearTimeout(n.timeout), this.messageQueue.delete(t.payload.messageId), n.resolve(t));
        }
      } catch (t) {
        console.warn("[MessageBridge] Invalid message:", t);
      }
  }
  /**
   * 发送消息并等待响应
   */
  async sendAndWait(e, t = 3e4) {
    return new Promise((n, a) => {
      let r;
      e.type === "sendMessage" ? r = e.payload.messageId : r = `bridge_${Date.now()}_${this.messageId++}`;
      const c = setTimeout(() => {
        this.messageQueue.delete(r), a(new Error(`Message timeout: ${e.type}`));
      }, t);
      this.messageQueue.set(r, {
        resolve: n,
        reject: a,
        timeout: c
      }), this.send(e);
    });
  }
  /**
   * 发送消息(不等待响应)
   */
  send(e) {
    const t = this.config.getContentWindow();
    if (!t)
      return this.config.onError?.(new Error("Iframe not available")), !1;
    try {
      return y.parse(e), t.postMessage(e, this.config.targetOrigin), !0;
    } catch (n) {
      return this.config.onError?.(n), !1;
    }
  }
  /**
   * 获取消息 ID(用于请求-响应匹配)
   */
  getMessageId(e) {
    return e.type === "sendMessage" ? e.payload.messageId : null;
  }
  /**
   * 获取待处理消息数量
   */
  getPendingCount() {
    return this.messageQueue.size;
  }
  /**
   * 是否正在监听
   */
  isActive() {
    return this.isListening;
  }
}
var g = /* @__PURE__ */ ((i) => (i.CONNECTING = "connecting", i.CONNECTED = "connected", i.DISCONNECTED = "disconnected", i.ERROR = "error", i))(g || {}), w = /* @__PURE__ */ ((i) => (i.NETWORK = "network", i.TIMEOUT = "timeout", i.IFRAME_LOAD_FAILED = "iframe_load_failed", i.UNAUTHORIZED = "unauthorized", i.UNKNOWN = "unknown", i))(w || {});
class p extends Error {
  constructor(e, t, n = !0) {
    super(t), this.type = e, this.retryable = n, this.name = "ConnectionError";
  }
}
class M {
  constructor(e, t, n) {
    this.state = "disconnected", this.listeners = /* @__PURE__ */ new Set(), this.heartbeatTimer = null, this.missedHeartbeats = 0, this.reconnectAttempts = 0, this.reconnectTimer = null, this.getContentWindow = e, this.targetOrigin = t, this.config = {
      heartbeatInterval: n?.heartbeatInterval ?? 5e3,
      maxMissedHeartbeats: n?.maxMissedHeartbeats ?? 3,
      reconnectDelay: n?.reconnectDelay ?? 1e3,
      maxReconnectAttempts: n?.maxReconnectAttempts ?? 5
    };
  }
  /**
   * 启动连接管理器
   */
  start() {
    this.setState(
      "connecting"
      /* CONNECTING */
    ), this.startHeartbeat();
  }
  /**
   * 停止连接管理器
   */
  stop() {
    this.stopHeartbeat(), this.stopReconnect(), this.setState(
      "disconnected"
      /* DISCONNECTED */
    );
  }
  /**
   * 添加事件监听器
   */
  on(e) {
    return this.listeners.add(e), () => this.listeners.delete(e);
  }
  /**
   * 发送心跳消息
   */
  sendHeartbeat() {
    const e = this.getContentWindow();
    if (!e) {
      this.handleMissedHeartbeat();
      return;
    }
    try {
      e.postMessage(
        { type: "heartbeat", timestamp: Date.now() },
        this.targetOrigin
      ), this.missedHeartbeats++, this.missedHeartbeats > this.config.maxMissedHeartbeats && this.handleDisconnection();
    } catch {
      this.handleMissedHeartbeat();
    }
  }
  /**
   * 处理心跳响应
   */
  handleHeartbeatAck() {
    this.missedHeartbeats = 0, this.state !== "connected" && (this.setState(
      "connected"
      /* CONNECTED */
    ), this.reconnectAttempts = 0), this.emit({ type: "heartbeat" });
  }
  /**
   * 处理丢失的心跳
   */
  handleMissedHeartbeat() {
    this.missedHeartbeats++, this.missedHeartbeats > this.config.maxMissedHeartbeats && this.handleDisconnection();
  }
  /**
   * 处理断开连接
   */
  handleDisconnection() {
    this.setState(
      "disconnected"
      /* DISCONNECTED */
    ), this.stopHeartbeat(), this.attemptReconnect();
  }
  /**
   * 尝试重连
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      const r = new p(
        "network",
        "Max reconnection attempts reached",
        !1
      );
      this.setState(
        "error"
        /* ERROR */
      ), this.emit({
        type: "reconnectFailed",
        error: r
      });
      return;
    }
    this.reconnectAttempts++, this.emit({
      type: "reconnecting",
      attempt: this.reconnectAttempts,
      maxAttempts: this.config.maxReconnectAttempts
    });
    const e = this.config.reconnectDelay, t = Math.min(
      e * Math.pow(2, this.reconnectAttempts - 1),
      3e4
      // 最大 30 秒
    ), n = Math.random() * 1e3, a = t + n;
    console.log(
      `[ConnectionManager] Reconnect attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts} in ${Math.round(a)}ms`
    ), this.reconnectTimer = setTimeout(() => {
      this.setState(
        "connecting"
        /* CONNECTING */
      ), this.startHeartbeat();
    }, a);
  }
  /**
   * 处理致命错误
   */
  handleFatalError(e, t) {
    const n = new p(e, t, !1);
    this.setState(
      "error"
      /* ERROR */
    ), this.stopHeartbeat(), this.stopReconnect(), this.emit({
      type: "error",
      error: n
    });
  }
  /**
   * 处理可恢复错误
   */
  handleRecoverableError(e, t) {
    const n = new p(e, t, !0);
    this.emit({
      type: "error",
      error: n
    });
  }
  /**
   * 重置重连计数
   */
  resetReconnectAttempts() {
    this.reconnectAttempts = 0;
  }
  /**
   * 手动触发重连
   */
  reconnect() {
    this.stopReconnect(), this.reconnectAttempts = 0, this.setState(
      "connecting"
      /* CONNECTING */
    ), this.startHeartbeat();
  }
  /**
   * 检查连接是否健康
   */
  isHealthy() {
    return this.state === "connected" && this.missedHeartbeats < Math.floor(this.config.maxMissedHeartbeats / 2);
  }
  /**
   * 获取连接统计信息
   */
  getStats() {
    return {
      state: this.state,
      missedHeartbeats: this.missedHeartbeats,
      reconnectAttempts: this.reconnectAttempts,
      isHealthy: this.isHealthy()
    };
  }
  /**
   * 启动心跳
   */
  startHeartbeat() {
    this.stopHeartbeat(), this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, this.config.heartbeatInterval);
  }
  /**
   * 停止心跳
   */
  stopHeartbeat() {
    this.heartbeatTimer && (clearInterval(this.heartbeatTimer), this.heartbeatTimer = null), this.missedHeartbeats = 0;
  }
  /**
   * 停止重连
   */
  stopReconnect() {
    this.reconnectTimer && (clearTimeout(this.reconnectTimer), this.reconnectTimer = null), this.reconnectAttempts = 0;
  }
  /**
   * 设置连接状态
   */
  setState(e) {
    this.state !== e && (this.state = e, this.emit({ type: "stateChange", state: e }));
  }
  /**
   * 触发事件
   */
  emit(e) {
    this.listeners.forEach((t) => {
      try {
        t(e);
      } catch (n) {
        console.error("[ConnectionManager] Listener error:", n);
      }
    });
  }
  /**
   * 获取当前连接状态
   */
  getState() {
    return this.state;
  }
  /**
   * 是否已连接
   */
  isConnected() {
    return this.state === "connected";
  }
}
var S = /* @__PURE__ */ ((i) => (i.IFRAME_NOT_READY = "IFRAME_NOT_READY", i.DISCONNECTED = "DISCONNECTED", i.MESSAGE_TIMEOUT = "MESSAGE_TIMEOUT", i.INVALID_RESPONSE = "INVALID_RESPONSE", i.SEND_FAILED = "SEND_FAILED", i))(S || {});
class o extends Error {
  constructor(e, t, n) {
    super(t), this.type = e, this.originalError = n, this.name = "SDKError";
  }
}
class D {
  constructor(e) {
    this.messageId = 0, this.messageHistory = [], this.config = e, this.iframeManager = new f(e), this.iframe = this.iframeManager.createIframe(), this.bridge = new I({
      targetOrigin: e.targetOrigin,
      getContentWindow: () => this.iframeManager.getContentWindow(),
      onMessage: this.handleBridgeMessage.bind(this),
      onError: e.onError
    }), this.connection = new M(
      () => this.iframeManager.getContentWindow(),
      e.targetOrigin
    ), this.connection.on((t) => {
      switch (t.type) {
        case "stateChange":
          this.config.onStateChange?.(t.state), (t.state === g.DISCONNECTED || t.state === g.ERROR) && this.rejectPendingMessages(new o(
            "DISCONNECTED",
            "Connection lost while waiting for response"
          ));
          break;
        case "error":
          this.config.onError?.(new o(
            "DISCONNECTED",
            t.error.message,
            t.error
          ));
          break;
        case "reconnecting":
          console.log(`[AIBridgeSDK] Reconnecting... (${t.attempt}/${t.maxAttempts})`);
          break;
        case "reconnectFailed":
          this.config.onError?.(new o(
            "DISCONNECTED",
            "Reconnection failed",
            t.error
          ));
          break;
      }
    }), this.init();
  }
  /**
   * 初始化 SDK
   */
  async init() {
    try {
      await this.iframeManager.waitForLoad(), this.bridge.start(), this.connection.start(), await this.sendInitMessage();
    } catch (e) {
      this.config.onError?.(e);
    }
  }
  /**
   * 处理来自桥接器的消息
   */
  handleBridgeMessage(e) {
    switch (e.type) {
      case "ready":
        break;
      case "messageResponse":
        this.config.onMessage?.(e.payload);
        break;
      case "error":
        this.config.onError?.(new Error(e.payload.message));
        break;
      case "heartbeatAck":
        this.connection.handleHeartbeatAck();
        break;
    }
  }
  /**
   * 发送初始化消息
   */
  async sendInitMessage() {
    const e = {
      type: "init",
      payload: {
        sessionId: this.config.context?.sessionId,
        theme: this.config.context?.theme ?? "light",
        locale: this.config.context?.locale ?? "zh-CN"
      }
    };
    await this.bridge.sendAndWait(e, 5e3);
  }
  /**
   * 发送消息到 Claude
   */
  async sendMessage(e, t) {
    const n = t?.timeout ?? 3e4, a = t?.retry ?? 1;
    if (!this.connection.isConnected())
      throw new o(
        "DISCONNECTED",
        "SDK not connected. Wait for the connection to be established."
      );
    if (!e || e.trim().length === 0)
      throw new o(
        "INVALID_RESPONSE",
        "Message text cannot be empty"
      );
    if (e.length > 1e4)
      throw new o(
        "INVALID_RESPONSE",
        "Message text too long (max 10000 characters)"
      );
    let r = null;
    for (let c = 0; c <= a; c++)
      try {
        const h = `msg_${Date.now()}_${this.messageId++}`, m = {
          type: "sendMessage",
          payload: {
            text: e,
            sessionId: this.config.context?.sessionId,
            messageId: h
          }
        }, d = await this.bridge.sendAndWait(m, n);
        if (d.type === "messageResponse") {
          const l = d.payload;
          return this.messageHistory.push(l), this.config.onMessage?.(l), l;
        } else
          throw new o(
            "INVALID_RESPONSE",
            `Unexpected response type: ${d.type}`
          );
      } catch (h) {
        if (r = h, c === a || h instanceof o && h.type === "INVALID_RESPONSE")
          break;
        await new Promise((m) => setTimeout(m, 1e3 * (c + 1)));
      }
    throw new o(
      "SEND_FAILED",
      `Failed to send message after ${a + 1} attempts`,
      r
    );
  }
  /**
   * 发送文本消息(简化版)
   *
   * @param text - 要发送的文本内容
   * @returns Promise<MessageResponse> Claude 的响应
   *
   * @example
   * const response = await sdk.chat('Hello, Claude!');
   * console.log(response.content);
   */
  async chat(e) {
    return this.sendMessage(e);
  }
  /**
   * 批量发送消息
   *
   * @param messages - 消息数组
   * @returns Promise<MessageResponse[]> 所有响应
   *
   * @example
   * const responses = await sdk.batch([
   *   'First message',
   *   'Second message',
   * ]);
   */
  async batch(e) {
    const t = [];
    for (const n of e) {
      const a = await this.sendMessage(n);
      t.push(a);
    }
    return t;
  }
  /**
   * 流式发送消息(带回调)
   *
   * @param text - 要发送的文本
   * @param callbacks - 回调函数
   * @returns Promise<MessageResponse> 最终响应
   *
   * @example
   * await sdk.stream('Long message...', {
   *   onProgress: (delta) => console.log('Received:', delta),
   *   onComplete: (response) => console.log('Done:', response),
   * });
   */
  async stream(e, t) {
    try {
      const n = await this.sendMessage(e);
      return t?.onComplete?.(n), n;
    } catch (n) {
      throw t?.onError?.(n), n;
    }
  }
  /**
   * 获取消息历史
   */
  getMessageHistory() {
    return [...this.messageHistory];
  }
  /**
   * 清空消息历史
   */
  clearHistory() {
    this.messageHistory = [];
  }
  /**
   * 拒绝所有待处理的消息
   */
  rejectPendingMessages(e) {
    this.config.onError?.(e);
  }
  /**
   * 检查 SDK 是否可用
   */
  isAvailable() {
    return this.connection.isConnected() && this.bridge.isActive();
  }
  /**
   * 等待 SDK 连接就绪
   */
  async ready(e = 3e4) {
    return new Promise((t, n) => {
      if (this.connection.isConnected()) {
        t();
        return;
      }
      const a = setTimeout(() => {
        c(), n(new o(
          "MESSAGE_TIMEOUT",
          "SDK ready timeout"
        ));
      }, e), r = this.connection.on((h) => {
        h.type === "stateChange" && h.state === g.CONNECTED ? (c(), t()) : h.type === "reconnectFailed" && (c(), n(new o(
          "DISCONNECTED",
          "Failed to connect"
        )));
      }), c = () => {
        clearTimeout(a), r();
      };
    });
  }
  /**
   * 获取诊断信息
   */
  getDiagnostics() {
    return {
      state: this.connection.getState(),
      stats: this.connection.getStats(),
      pendingMessages: this.bridge.getPendingCount(),
      messageHistoryLength: this.messageHistory.length,
      iframeAttached: !!this.iframe.parentNode
    };
  }
  /**
   * 销毁 SDK
   */
  destroy() {
    this.bridge.stop(), this.connection.stop(), this.iframeManager.destroy();
  }
  /**
   * 获取当前连接状态
   */
  getState() {
    return this.connection.getState();
  }
}
export {
  D as AIBridgeSDK,
  p as ConnectionError,
  w as ConnectionErrorType,
  M as ConnectionManager,
  g as ConnectionState,
  f as IframeManager,
  E as IframeResponseSchema,
  I as MessageBridge,
  b as MessageResponseSchema,
  o as SDKError,
  S as SDKErrorType,
  y as SdkMessageSchema,
  u as SendMessagePayloadSchema
};
