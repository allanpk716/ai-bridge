import type { SDKConfig } from '../types/config';

/**
 * iframe 管理器
 * 负责创建、管理和清理 iframe 元素
 */
export class IframeManager {
  private iframe: HTMLIFrameElement | null = null;
  private config: SDKConfig;

  constructor(config: SDKConfig) {
    this.config = config;
  }

  /**
   * 创建并返回 iframe 元素
   */
  createIframe(): HTMLIFrameElement {
    // 创建 iframe
    this.iframe = document.createElement('iframe');

    // 设置属性
    this.iframe.src = this.buildIframeUrl();
    this.iframe.style.border = 'none';
    this.iframe.style.width = '100%';
    this.iframe.style.height = '100%';
    this.iframe.style.overflow = 'hidden';

    // 应用自定义样式
    if (this.config.containerStyle) {
      Object.assign(this.iframe.style, this.config.containerStyle);
    }

    // 设置安全属性
    this.iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups');

    return this.iframe;
  }

  /**
   * 构建 iframe URL(包含上下文参数)
   */
  private buildIframeUrl(): string {
    const url = new URL(this.config.url);

    // 添加上下文参数
    if (this.config.context) {
      if (this.config.context.sessionId) {
        url.searchParams.set('sessionId', this.config.context.sessionId);
      }
      if (this.config.context.theme) {
        url.searchParams.set('theme', this.config.context.theme);
      }
      if (this.config.context.locale) {
        url.searchParams.set('locale', this.config.context.locale);
      }
    }

    // 标记为嵌入式模式
    url.searchParams.set('embed', 'true');

    return url.toString();
  }

  /**
   * 获取 iframe 的 contentWindow
   */
  getContentWindow(): Window | null {
    return this.iframe?.contentWindow ?? null;
  }

  /**
   * 等待 iframe 加载完成
   */
  async waitForLoad(): Promise<void> {
    if (!this.iframe) {
      throw new Error('Iframe not created');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Iframe load timeout'));
      }, 10000);

      this.iframe!.addEventListener('load', () => {
        clearTimeout(timeout);
        resolve();
      }, { once: true });
    });
  }

  /**
   * 销毁 iframe
   */
  destroy(): void {
    if (this.iframe) {
      this.iframe.remove();
      this.iframe = null;
    }
  }

  /**
   * 获取 iframe 元素(用于挂载到 DOM)
   */
  getIframe(): HTMLIFrameElement | null {
    return this.iframe;
  }
}
