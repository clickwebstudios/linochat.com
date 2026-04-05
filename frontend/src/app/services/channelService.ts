import { api } from '../api/client';
import type { ApiResponse } from '../api/client';

export interface MessengerStatus {
  connected: boolean;
  page_id: string | null;
  has_twilio: boolean;
}

export interface MessengerConnectPayload {
  page_access_token: string;
  page_id: string;
  page_name: string;
}

export interface MessengerConnectData {
  [key: string]: unknown;
}

export interface WhatsAppSandboxStatus {
  sandbox_number: string | null;
  join_keyword: string | null;
  has_twilio: boolean;
  waba_connected: boolean;
  instructions: string | null;
}

export interface WhatsAppSandboxConnectData {
  sandbox_number: string;
  join_keyword: string;
  instructions: string;
}

export const channelService = {
  getMessengerStatus: (): Promise<ApiResponse<MessengerStatus>> =>
    api.get<MessengerStatus>('/integrations/messenger/status'),

  connectMessenger: (payload: MessengerConnectPayload): Promise<ApiResponse<MessengerConnectData>> =>
    api.post<MessengerConnectData>('/integrations/messenger/connect', payload),

  disconnectMessenger: (): Promise<ApiResponse<null>> =>
    api.delete<null>('/integrations/messenger/disconnect'),

  getWhatsAppSandboxStatus: (): Promise<ApiResponse<WhatsAppSandboxStatus>> =>
    api.get<WhatsAppSandboxStatus>('/integrations/whatsapp/sandbox/status'),

  connectWhatsAppSandbox: (): Promise<ApiResponse<WhatsAppSandboxConnectData>> =>
    api.post<WhatsAppSandboxConnectData>('/integrations/whatsapp/sandbox/connect', {}),
};
