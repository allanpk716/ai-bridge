import { useEffect } from 'react';
import { detectSdkMode } from './types';
import { setupSdkMessageListener } from './handlers';

interface SdkMessageListenerProps {
  /** 子组件 */
  children: React.ReactNode;
}

/**
 * SDK 消息监听组件
 *
 * 在应用根部渲染,用于处理来自 SDK 的 postMessage。
 * 仅在嵌入模式下激活。
 */
export function SdkMessageListener({ children }: SdkMessageListenerProps): JSX.Element {
  useEffect(() => {
    // 检测是否处于 SDK 模式
    const sdkMode = detectSdkMode();

    if (!sdkMode.isEmbedded) {
      // 不是嵌入模式,不设置监听器
      return;
    }

    console.log('[SdkMessageListener] Running in embedded mode');

    // 应用嵌入模式样式
    document.body.classList.add('embed-mode');
    document.documentElement.classList.add('embed-mode');

    // 设置消息监听器
    const cleanup = setupSdkMessageListener(sdkMode);

    // 清理函数
    return () => {
      cleanup?.();
      document.body.classList.remove('embed-mode');
      document.documentElement.classList.remove('embed-mode');
    };
  }, []);

  return <>{children}</>;
}
