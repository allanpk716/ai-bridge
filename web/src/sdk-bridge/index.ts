// 类型定义
export type {
  SdkModeConfig,
  SdkInitContext,
  SdkIncomingMessage,
  SdkOutgoingMessage,
} from './types';
export {
  detectSdkMode,
  getInitContextFromUrl,
} from './types';

// 消息处理器
export {
  setupSdkMessageListener,
  sendErrorToSdk,
  getSdkConnectionState,
} from './handlers';

// React 组件
export { SdkMessageListener } from './SdkMessageListener';
