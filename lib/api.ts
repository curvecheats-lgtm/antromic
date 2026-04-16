const API_URL = (process.env.NEXT_PUBLIC_CLOUDFLARE_WORKER_URL || 'https://curve-api.umiwinsupport.workers.dev').replace(/\/$/, '');

export interface Key {
  key: string;
  note: string;
  hwid: string | null;
  createdAt: number;
  createdBy?: string;
  duration: number;
  expiresAt: number;
  used: boolean;
  usedBy: string | null;
}

export interface User {
  id: string;
  username: string;
  key: string;
  createdAt: number;
  isAdmin: boolean;
  hwid: string | null;
  role?: string;
}

export interface Admin {
  username: string;
  adminKey: string;
  role: string;
  permissions: string[];
}

export interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: number;
  role?: string;
  isAdmin?: boolean;
}

export interface Config {
  id: string;
  name: string;
  description: string;
  content: string;
  game: string;
  author: string;
  downloads: number;
  likes: number;
  createdAt: number;
}

export interface Ticket {
  id: string;
  username: string;
  subject: string;
  messages: { from: string; message: string; timestamp: number }[];
  status: 'open' | 'closed';
  createdAt: number;
}

export interface NewsPost {
  id: string;
  title: string;
  content: string;
  author?: string;
  createdAt: number;
}

export interface Loader {
  id: string;
  version: string;
  changelog: string;
  downloadUrl: string;
  isCurrent: boolean;
  mode: 'manual' | 'automatic';
  robloxVersion?: string | null;
  uploadedBy?: string;
  createdAt: number;
  updatedAt?: number;
  updatedBy?: string;
}

export interface Stats {
  totalKeys: number;
  activeKeys: number;
  usedKeys: number;
  openTickets: number;
}

async function fetchApi(endpoint: string, options?: RequestInit) {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    
    const data = await res.json();
    
    // If response is not ok, throw error with message from API
    if (!res.ok) {
      return { 
        success: false, 
        error: data.error || `HTTP error ${res.status}` 
      };
    }
    
    return data;
  } catch (err) {
    // Network or parsing error
    console.error('API fetch error:', err);
    return { 
      success: false, 
      error: 'Failed to connect to server' 
    };
  }
}

// Key APIs
export const keysApi = {
  create: (username: string, adminKey: string, note?: string, duration?: number) =>
    fetchApi('/api/keys/create', {
      method: 'POST',
      body: JSON.stringify({ username, adminKey, note, duration }),
    }),

  list: (username: string, adminKey: string) =>
    fetchApi('/api/keys/list', {
      method: 'POST',
      body: JSON.stringify({ username, adminKey }),
    }),

  delete: (username: string, adminKey: string, key: string) =>
    fetchApi('/api/keys/delete', {
      method: 'POST',
      body: JSON.stringify({ username, adminKey, key }),
    }),

  resetHwid: (username: string, adminKey: string, key: string) =>
    fetchApi('/api/keys/reset-hwid', {
      method: 'POST',
      body: JSON.stringify({ username, adminKey, key }),
    }),

  updateNote: (username: string, adminKey: string, key: string, note: string) =>
    fetchApi('/api/keys/update-note', {
      method: 'POST',
      body: JSON.stringify({ username, adminKey, key, note }),
    }),

  extend: (username: string, adminKey: string, key: string, additionalDays: number) =>
    fetchApi('/api/keys/extend', {
      method: 'POST',
      body: JSON.stringify({ username, adminKey, key, additionalDays }),
    }),

  validate: (key: string, hwid?: string) =>
    fetchApi('/api/keys/validate', {
      method: 'POST',
      body: JSON.stringify({ key, hwid }),
    }),
};

// User APIs
export const usersApi = {
  register: (username: string, password: string, key: string) =>
    fetchApi('/api/users/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, key }),
    }),

  login: (username: string, password: string) =>
    fetchApi('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  verify: (token: string) =>
    fetchApi('/api/users/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  // Admin user management
  list: (username: string, adminKey: string) =>
    fetchApi('/api/users/list', {
      method: 'POST',
      body: JSON.stringify({ username, adminKey }),
    }),

  create: (username: string, adminKey: string, newUsername: string, password: string, role?: string) =>
    fetchApi('/api/users/create', {
      method: 'POST',
      body: JSON.stringify({ username, adminKey, newUsername, password, role }),
    }),

  updateRole: (username: string, adminKey: string, userId: string, role: string) =>
    fetchApi('/api/users/update-role', {
      method: 'POST',
      body: JSON.stringify({ username, adminKey, userId, role }),
    }),

  setStatus: (username: string, adminKey: string, userId: string, status: 'active' | 'banned') =>
    fetchApi('/api/users/set-status', {
      method: 'POST',
      body: JSON.stringify({ username, adminKey, userId, status }),
    }),

  delete: (username: string, adminKey: string, userId: string) =>
    fetchApi('/api/users/delete', {
      method: 'POST',
      body: JSON.stringify({ username, adminKey, userId }),
    }),

  bindKey: (username: string, adminKey: string, userId: string, keyId?: string, duration?: number) =>
    fetchApi('/api/users/bind-key', {
      method: 'POST',
      body: JSON.stringify({ username, adminKey, userId, keyId, duration }),
    }),
};

// Admin APIs
export const adminApi = {
  login: (username: string, password: string) =>
    fetchApi('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  verify: (username: string, adminKey: string) =>
    fetchApi('/api/admin/verify', {
      method: 'POST',
      body: JSON.stringify({ username, adminKey }),
    }),

  getStats: (username: string, adminKey: string) =>
    fetchApi('/api/stats', {
      method: 'POST',
      body: JSON.stringify({ username, adminKey }),
    }),

  getUserDetails: (username: string, adminKey: string, targetUserId: string) =>
    fetchApi('/api/admin/user-details', {
      method: 'POST',
      body: JSON.stringify({ username, adminKey, targetUserId }),
    }),
};

// Chat APIs
export const chatApi = {
  getMessages: () => fetchApi('/api/chat/messages'),

  send: (token: string, message: string) =>
    fetchApi('/api/chat/send', {
      method: 'POST',
      body: JSON.stringify({ token, message }),
    }),

  sendAsAdmin: (username: string, adminKey: string, message: string) =>
    fetchApi('/api/chat/send', {
      method: 'POST',
      body: JSON.stringify({ username, adminKey, message, isAdmin: true }),
    }),
};

// Config APIs
export const configsApi = {
  list: () => fetchApi('/api/configs/list'),

  upload: (token: string, name: string, description: string, content: string, game: string) =>
    fetchApi('/api/configs/upload', {
      method: 'POST',
      body: JSON.stringify({ token, name, description, content, game }),
    }),

  download: (configId: string) =>
    fetchApi('/api/configs/download', {
      method: 'POST',
      body: JSON.stringify({ configId }),
    }),
};

// Ticket APIs
export const ticketsApi = {
  create: (token: string, subject: string, message: string) =>
    fetchApi('/api/tickets/create', {
      method: 'POST',
      body: JSON.stringify({ token, subject, message }),
    }),

  myTicket: (token: string) =>
    fetchApi('/api/tickets/my-ticket', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  reply: (token: string, ticketId: string, message: string) =>
    fetchApi('/api/tickets/reply', {
      method: 'POST',
      body: JSON.stringify({ token, ticketId, message }),
    }),

  replyAsAdmin: (username: string, adminKey: string, ticketId: string, message: string) =>
    fetchApi('/api/tickets/reply', {
      method: 'POST',
      body: JSON.stringify({ username, adminKey, ticketId, message, isAdmin: true }),
    }),

  list: (username: string, adminKey: string) =>
    fetchApi('/api/tickets/list', {
      method: 'POST',
      body: JSON.stringify({ username, adminKey }),
    }),

  close: (username: string, adminKey: string, ticketId: string) =>
    fetchApi('/api/tickets/close', {
      method: 'POST',
      body: JSON.stringify({ username, adminKey, ticketId }),
    }),
};

// News APIs
export const newsApi = {
  list: () => fetchApi('/api/news/list'),

  create: (username: string, adminKey: string, title: string, content: string) =>
    fetchApi('/api/news/create', {
      method: 'POST',
      body: JSON.stringify({ username, adminKey, title, content }),
    }),
};

// Loader APIs
export const loadersApi = {
  list: () => fetchApi('/api/loaders/list'),

  upload: (
    username: string, 
    adminKey: string, 
    version: string, 
    changelog: string, 
    downloadUrl: string, 
    isCurrent: boolean,
    mode: 'manual' | 'automatic' = 'automatic',
    robloxVersion?: string
  ) =>
    fetchApi('/api/loaders/upload', {
      method: 'POST',
      body: JSON.stringify({ 
        username, 
        adminKey, 
        version, 
        changelog, 
        downloadUrl, 
        isCurrent,
        mode,
        robloxVersion
      }),
    }),

  update: (
    username: string,
    adminKey: string,
    loaderId: string,
    data: {
      version?: string;
      changelog?: string;
      downloadUrl?: string;
      isCurrent?: boolean;
      mode?: 'manual' | 'automatic';
      robloxVersion?: string;
    }
  ) =>
    fetchApi('/api/loaders/update', {
      method: 'POST',
      body: JSON.stringify({ username, adminKey, loaderId, ...data }),
    }),

  delete: (username: string, adminKey: string, loaderId: string) =>
    fetchApi('/api/loaders/delete', {
      method: 'POST',
      body: JSON.stringify({ username, adminKey, loaderId }),
    }),
};

// Payment APIs
export const paymentApi = {
  verifyGamepass: (robloxUsername: string) =>
    fetchApi('/api/payment/verify-gamepass', {
      method: 'POST',
      body: JSON.stringify({ robloxUsername }),
    }),

  verifyCrypto: (senderWallet: string, cryptoType: 'btc' | 'eth' | 'ltc') =>
    fetchApi('/api/payment/verify-crypto', {
      method: 'POST',
      body: JSON.stringify({ senderWallet, cryptoType }),
    }),
};
