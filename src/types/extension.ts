// Tipos para integração com extension-php / wlExtension

export interface UserInfo {
  id?: string;
  userId?: string;
  systemKey?: string;
  name?: string;
  email?: string;
  ramal?: string;
  [key: string]: any;
}

export interface ContactInfo {
  id: string;
  name: string;
  secondaryName?: string;
  number: string;
  [key: string]: any;
}

export interface CallHistory {
  id: string;
  date: string;
  duration?: number;
  type: 'incoming' | 'outgoing' | 'missed';
  contactId?: string;
  [key: string]: any;
}

export interface ExtensionConfig {
  ramal?: string;
  senha?: string;
  [key: string]: any;
}

// Declaração global do wlExtension
declare global {
  interface Window {
    wlExtension?: {
      getInfoUser: () => Promise<UserInfo> | UserInfo;
      getContactInfo: () => Promise<ContactInfo> | ContactInfo;
      getCallHistory: (contactId?: string) => Promise<CallHistory[]> | CallHistory[];
      getInfoChannels?: () => Promise<any[]> | any[];
      on?: (event: string, callback: (data: any) => void) => void;
      off?: (event: string, callback: (data: any) => void) => void;
      emit?: (event: string, data?: any) => void;
      [key: string]: any;
    };
    WlExtension?: {
      getInfoUser?: () => Promise<UserInfo> | UserInfo;
      getInfoChannels?: () => Promise<any[]> | any[];
      closeModal?: (options?: {}) => void;
      alert?: (options: { message: string; variant: 'success' | 'error' | 'warning' }) => void;
      [key: string]: any;
    };
  }
}

export type ExtensionEvent = 
  | 'contact:selected'
  | 'contact:changed'
  | 'call:started'
  | 'call:ended'
  | 'user:updated'
  | string;

