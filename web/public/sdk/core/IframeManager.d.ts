import { SDKConfig } from '../types/config';
/**
 * iframe 管理器
 * 负责创建、管理和清理 iframe 元素
 */
export declare class IframeManager {
    private iframe;
    private config;
    constructor(config: SDKConfig);
    /**
     * 创建并返回 iframe 元素
     */
    createIframe(): HTMLIFrameElement;
    /**
     * 构建 iframe URL(包含上下文参数)
     */
    private buildIframeUrl;
    /**
     * 获取 iframe 的 contentWindow
     */
    getContentWindow(): Window | null;
    /**
     * 等待 iframe 加载完成
     */
    waitForLoad(): Promise<void>;
    /**
     * 销毁 iframe
     */
    destroy(): void;
    /**
     * 获取 iframe 元素(用于挂载到 DOM)
     */
    getIframe(): HTMLIFrameElement | null;
}
//# sourceMappingURL=IframeManager.d.ts.map