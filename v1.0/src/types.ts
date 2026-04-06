export type Message = {
  id: string;
  role: 'user' | 'model';
  text: string;
  parts?: any[];
  isPendingPermission?: boolean;
  permissionRequest?: {
    actionType: 'browser' | 'image' | 'video' | 'audio' | 'code';
    payload: string;
    reason: string;
    toolCallId: string;
  };
};

export type WorkspaceState = {
  activeTab: 'browser' | 'media' | 'code';
  browserUrl: string;
  mediaItems: { type: 'image' | 'video' | 'audio', url: string, prompt: string }[];
  code: string;
};

export type AppSettings = {
  theme: 'light' | 'dark';
  customApiKey: string;
  temperature: number;
};

