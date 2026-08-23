import { apiClient } from './client';

export interface ChatProductCard {
  id: string;
  name: string;
  price: number;
  store: string;
  unit: string;
  image: string | null;
}

export interface ChatOrderStatus {
  orderNumber: string;
  status: string;
  total: string;
  itemCount: number;
}

export interface ChatSuggestedAction {
  label: string;
  action: 'NAVIGATE' | 'TRACK_ORDER' | 'VIEW_DEALS' | 'VIEW_PRODUCT' | 'VIEW_BUDGET';
  payload?: string;
}

export interface ChatResponse {
  reply: string;
  suggestedActions?: ChatSuggestedAction[];
  productCards?: ChatProductCard[];
  orderStatus?: ChatOrderStatus;
}

export const chatApi = {
  sendMessage: async (input: {
    message: string;
    history?: Array<{ role: 'user' | 'assistant' | 'model'; content: string }>;
  }): Promise<ChatResponse> => {
    return apiClient<ChatResponse>('/chat/assistant', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
};
