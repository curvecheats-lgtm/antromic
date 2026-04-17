// ============================================
// ANTROMIC CLOUDFLARE WORKER API v1.0
// ============================================
// Required KV Namespaces:
// - ADMINS: Admin accounts
// - USERS: User accounts
// - KEYS: License keys
// - CHAT: Chat messages
// - CONFIGS: User configs
// - NEWS: News posts
// - LOADERS: Loader versions
// - ORDERS: Payment orders
// ============================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Preset admin accounts
const PRESET_ADMINS = {
  'antromicstaff': {
    username: 'antromicstaff',
    password: '111222333keys',
    role: 'owner',
    permissions: ['all']
  }
};

function generateKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const part1 = Array(4).fill(0).map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  const part2 = Array(4).fill(0).map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  const part3 = Array(4).fill(0).map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  const part4 = Array(4).fill(0).map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  return `ANT-${part1}-${part2}-${part3}-${part4}`;
}

function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'antromic_salt_2026');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password, hash) {
  const newHash = await hashPassword(password);
  return newHash === hash;
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

async function verifyAdmin(env, username, adminKey) {
  console.log('verifyAdmin called:', username, 'key provided:', !!adminKey);
  const adminData = await env.ADMINS.get(`admin_${username.toLowerCase()}`);
  console.log('Admin data found:', !!adminData);
  if (!adminData) return null;
  const admin = JSON.parse(adminData);
  console.log('Admin key match:', admin.adminKey === adminKey);
  if (admin.adminKey !== adminKey) return null;
  return admin;
}

function hasPermission(admin, permission) {
  if (!admin) return false;
  if (admin.permissions.includes('all')) return true;
  return admin.permissions.includes(permission);
}

export default {
  async fetch(request, env) {
    console.log('Request:', request.method, request.url);
    console.log('KV bindings:', Object.keys(env));
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    console.log('Path:', path);

    try {
      // ============ HEALTH CHECK ============
      if (path === '/' || path === '/api' || path === '/api/health') {
        return jsonResponse({ 
          status: 'ok', 
          service: 'Antromic API',
          version: '1.0',
          timestamp: Date.now()
        });
      }

      // ============ AUTH ROUTES ============

      // Register (alias for /api/users/register)
      if (path === '/api/users/register' && request.method === 'POST') {
        const { username, password, key, discord } = await request.json();

        if (!username || !password || !key) {
          return jsonResponse({ error: 'Missing required fields' }, 400);
        }

        // Validate key
        const keyData = await env.KEYS.get(key);
        if (!keyData) return jsonResponse({ error: 'Invalid key' }, 400);

        const parsedKey = JSON.parse(keyData);
        if (parsedKey.used) return jsonResponse({ error: 'Key already used' }, 400);
        if (Date.now() > parsedKey.expiresAt) return jsonResponse({ error: 'Key expired' }, 400);

        // Check if username exists
        const existingUser = await env.USERS.get(`user_${username.toLowerCase()}`);
        if (existingUser) return jsonResponse({ error: 'Username taken' }, 400);

        // Create user
        const hashedPassword = await hashPassword(password);
        const user = {
          id: generateId(),
          username,
          password: hashedPassword,
          key,
          role: 'user',
          createdAt: Date.now(),
          hwid: null,
          discord: discord || null,
          status: 'active'
        };

        await env.USERS.put(`user_${username.toLowerCase()}`, JSON.stringify(user));

        // Mark key as used
        parsedKey.used = true;
        parsedKey.usedBy = username;
        await env.KEYS.put(key, JSON.stringify(parsedKey));

        // Create session
        const token = generateId() + generateId();
        await env.USERS.put(`session_${token}`, JSON.stringify({ userId: user.id, username }), { expirationTtl: 86400 * 7 });

        return jsonResponse({ 
          success: true, 
          token, 
          user: { ...user, password: undefined }
        });
      }

      // Register
      if (path === '/api/auth/register' && request.method === 'POST') {
        const { username, password, key, discord } = await request.json();

        if (!username || !password || !key) {
          return jsonResponse({ error: 'Missing required fields' }, 400);
        }

        // Validate key
        const keyData = await env.KEYS.get(key);
        if (!keyData) return jsonResponse({ error: 'Invalid key' }, 400);

        const parsedKey = JSON.parse(keyData);
        if (parsedKey.used) return jsonResponse({ error: 'Key already used' }, 400);
        if (Date.now() > parsedKey.expiresAt) return jsonResponse({ error: 'Key expired' }, 400);

        // Check if username exists
        const existingUser = await env.USERS.get(`user_${username.toLowerCase()}`);
        if (existingUser) return jsonResponse({ error: 'Username taken' }, 400);

        // Create user
        const hashedPassword = await hashPassword(password);
        const user = {
          id: generateId(),
          username,
          password: hashedPassword,
          key,
          role: 'user',
          createdAt: Date.now(),
          hwid: null,
          discord: discord || null,
          status: 'active'
        };

        await env.USERS.put(`user_${username.toLowerCase()}`, JSON.stringify(user));

        // Mark key as used
        parsedKey.used = true;
        parsedKey.usedBy = username;
        await env.KEYS.put(key, JSON.stringify(parsedKey));

        // Create session
        const token = generateId() + generateId();
        await env.USERS.put(`session_${token}`, JSON.stringify({ userId: user.id, username }), { expirationTtl: 86400 * 7 });

        return jsonResponse({ 
          success: true, 
          token, 
          user: { ...user, password: undefined }
        });
      }

      // Login (alias for /api/users/login)
      if (path === '/api/users/login' && request.method === 'POST') {
        const { username, password } = await request.json();

        let userData = await env.USERS.get(`user_${username.toLowerCase()}`);
        
        if (!userData) {
          return jsonResponse({ error: 'Invalid credentials' }, 401);
        }

        const user = JSON.parse(userData);
        const validPassword = await verifyPassword(password, user.password);
        
        if (!validPassword) {
          return jsonResponse({ error: 'Invalid credentials' }, 401);
        }

        if (user.status === 'banned') {
          return jsonResponse({ error: 'Account banned' }, 403);
        }

        // Check key expiry
        const keyData = await env.KEYS.get(user.key);
        if (keyData) {
          const parsedKey = JSON.parse(keyData);
          if (Date.now() > parsedKey.expiresAt) {
            return jsonResponse({ error: 'Your key has expired' }, 400);
          }
        }

        const token = generateId() + generateId();
        await env.USERS.put(`session_${token}`, JSON.stringify({ userId: user.id, username }), { expirationTtl: 86400 * 7 });

        return jsonResponse({ 
          success: true, 
          token, 
          user: { ...user, password: undefined }
        });
      }

      // Login
      if (path === '/api/auth/login' && request.method === 'POST') {
        const { username, password } = await request.json();

        let userData = await env.USERS.get(`user_${username.toLowerCase()}`);
        
        if (!userData) {
          return jsonResponse({ error: 'Invalid credentials' }, 401);
        }

        const user = JSON.parse(userData);
        const validPassword = await verifyPassword(password, user.password);
        
        if (!validPassword) {
          return jsonResponse({ error: 'Invalid credentials' }, 401);
        }

        if (user.status === 'banned') {
          return jsonResponse({ error: 'Account banned' }, 403);
        }

        // Check key expiry
        const keyData = await env.KEYS.get(user.key);
        if (keyData) {
          const parsedKey = JSON.parse(keyData);
          if (Date.now() > parsedKey.expiresAt) {
            return jsonResponse({ error: 'Your key has expired' }, 400);
          }
        }

        const token = generateId() + generateId();
        await env.USERS.put(`session_${token}`, JSON.stringify({ userId: user.id, username }), { expirationTtl: 86400 * 7 });

        return jsonResponse({ 
          success: true, 
          token, 
          user: { ...user, password: undefined }
        });
      }

      // Verify session (alias for /api/users/verify)
      if (path === '/api/users/verify' && request.method === 'POST') {
        const { token } = await request.json();
        
        const session = await env.USERS.get(`session_${token}`);
        if (!session) return jsonResponse({ error: 'Invalid session' }, 401);

        const { username } = JSON.parse(session);
        const userData = await env.USERS.get(`user_${username.toLowerCase()}`);
        if (!userData) return jsonResponse({ error: 'User not found' }, 404);

        const user = JSON.parse(userData);
        return jsonResponse({ 
          success: true, 
          user: { ...user, password: undefined }
        });
      }

      // Verify session
      if (path === '/api/auth/verify' && request.method === 'POST') {
        const { token } = await request.json();
        
        const session = await env.USERS.get(`session_${token}`);
        if (!session) return jsonResponse({ error: 'Invalid session' }, 401);

        const { username } = JSON.parse(session);
        const userData = await env.USERS.get(`user_${username.toLowerCase()}`);
        if (!userData) return jsonResponse({ error: 'User not found' }, 404);

        const user = JSON.parse(userData);
        return jsonResponse({ 
          success: true, 
          user: { ...user, password: undefined }
        });
      }

      // Admin Login
      if (path === '/api/admin/login' && request.method === 'POST') {
        const { username, password } = await request.json();
        
        if (!username || !password) {
          return jsonResponse({ error: 'Username and password required' }, 400);
        }

        let adminData = await env.ADMINS.get(`admin_${username.toLowerCase()}`);
        
        if (!adminData) {
          // First-time login with preset
          const preset = PRESET_ADMINS[username.toLowerCase()];
          if (!preset || password !== preset.password) {
            return jsonResponse({ error: 'Invalid credentials' }, 401);
          }

          const hashedPassword = await hashPassword(password);
          const adminKey = generateId() + generateId();
          
          const newAdmin = {
            id: generateId(),
            username: username.toLowerCase(),
            password: hashedPassword,
            adminKey,
            role: preset.role,
            permissions: preset.permissions,
            createdAt: Date.now(),
            lastLogin: Date.now()
          };

          await env.ADMINS.put(`admin_${username.toLowerCase()}`, JSON.stringify(newAdmin));
          
          return jsonResponse({ 
            success: true, 
            adminKey,
            username: newAdmin.username,
            role: newAdmin.role
          });
        }

        const admin = JSON.parse(adminData);
        const validPassword = await verifyPassword(password, admin.password);
        
        if (!validPassword) {
          return jsonResponse({ error: 'Invalid credentials' }, 401);
        }

        admin.lastLogin = Date.now();
        await env.ADMINS.put(`admin_${username.toLowerCase()}`, JSON.stringify(admin));

        return jsonResponse({ 
          success: true, 
          adminKey: admin.adminKey,
          username: admin.username,
          role: admin.role
        });
      }

      // Verify admin
      if (path === '/api/admin/verify' && request.method === 'POST') {
        const { username, adminKey } = await request.json();
        const admin = await verifyAdmin(env, username, adminKey);
        if (!admin) return jsonResponse({ error: 'Invalid session' }, 401);

        return jsonResponse({ 
          success: true,
          username: admin.username,
          role: admin.role,
          permissions: admin.permissions
        });
      }

      // ============ USER MANAGEMENT ============

      // List users (admin only)
      if (path === '/api/users/list' && request.method === 'POST') {
        const { username, adminKey } = await request.json();
        const admin = await verifyAdmin(env, username, adminKey);
        if (!admin) return jsonResponse({ error: 'Unauthorized' }, 401);

        const usersList = await env.USERS.list();
        const users = [];
        for (const key of usersList.keys) {
          if (key.name.startsWith('user_')) {
            const data = await env.USERS.get(key.name);
            if (data) {
              const user = JSON.parse(data);
              users.push({ ...user, password: undefined });
            }
          }
        }
        return jsonResponse({ users });
      }

      // Get user details
      if (path === '/api/users/details' && request.method === 'POST') {
        const { username, adminKey, userId } = await request.json();
        const admin = await verifyAdmin(env, username, adminKey);
        if (!admin) return jsonResponse({ error: 'Unauthorized' }, 401);

        const usersList = await env.USERS.list();
        for (const key of usersList.keys) {
          if (key.name.startsWith('user_')) {
            const data = await env.USERS.get(key.name);
            if (data) {
              const user = JSON.parse(data);
              if (user.id === userId) {
                return jsonResponse({ user });
              }
            }
          }
        }
        return jsonResponse({ error: 'User not found' }, 404);
      }

      // Update user role
      if (path === '/api/users/update-role' && request.method === 'POST') {
        const { username, adminKey, userId, role } = await request.json();
        const admin = await verifyAdmin(env, username, adminKey);
        if (!admin) return jsonResponse({ error: 'Unauthorized' }, 401);

        const usersList = await env.USERS.list();
        for (const key of usersList.keys) {
          if (key.name.startsWith('user_')) {
            const data = await env.USERS.get(key.name);
            if (data) {
              const user = JSON.parse(data);
              if (user.id === userId) {
                user.role = role;
                await env.USERS.put(key.name, JSON.stringify(user));
                return jsonResponse({ success: true, user: { ...user, password: undefined } });
              }
            }
          }
        }
        return jsonResponse({ error: 'User not found' }, 404);
      }

      // Set user status (ban/unban)
      if (path === '/api/users/set-status' && request.method === 'POST') {
        const { username, adminKey, userId, status } = await request.json();
        const admin = await verifyAdmin(env, username, adminKey);
        if (!admin) return jsonResponse({ error: 'Unauthorized' }, 401);

        const usersList = await env.USERS.list();
        for (const key of usersList.keys) {
          if (key.name.startsWith('user_')) {
            const data = await env.USERS.get(key.name);
            if (data) {
              const user = JSON.parse(data);
              if (user.id === userId) {
                user.status = status;
                await env.USERS.put(key.name, JSON.stringify(user));
                return jsonResponse({ success: true, user: { ...user, password: undefined } });
              }
            }
          }
        }
        return jsonResponse({ error: 'User not found' }, 404);
      }

      // Delete user
      if (path === '/api/users/delete' && request.method === 'POST') {
        const { username, adminKey, userId } = await request.json();
        const admin = await verifyAdmin(env, username, adminKey);
        if (!admin) return jsonResponse({ error: 'Unauthorized' }, 401);

        const usersList = await env.USERS.list();
        for (const key of usersList.keys) {
          if (key.name.startsWith('user_')) {
            const data = await env.USERS.get(key.name);
            if (data) {
              const user = JSON.parse(data);
              if (user.id === userId) {
                await env.USERS.delete(key.name);
                return jsonResponse({ success: true });
              }
            }
          }
        }
        return jsonResponse({ error: 'User not found' }, 404);
      }

      // Reset HWID
      if (path === '/api/users/reset-hwid' && request.method === 'POST') {
        const { username, adminKey, userId } = await request.json();
        const admin = await verifyAdmin(env, username, adminKey);
        if (!admin) return jsonResponse({ error: 'Unauthorized' }, 401);

        const usersList = await env.USERS.list();
        for (const key of usersList.keys) {
          if (key.name.startsWith('user_')) {
            const data = await env.USERS.get(key.name);
            if (data) {
              const user = JSON.parse(data);
              if (user.id === userId) {
                user.hwid = null;
                await env.USERS.put(key.name, JSON.stringify(user));
                
                // Also reset in key
                const keyData = await env.KEYS.get(user.key);
                if (keyData) {
                  const parsed = JSON.parse(keyData);
                  parsed.hwid = null;
                  await env.KEYS.put(user.key, JSON.stringify(parsed));
                }
                
                return jsonResponse({ success: true });
              }
            }
          }
        }
        return jsonResponse({ error: 'User not found' }, 404);
      }

      // ============ KEY MANAGEMENT ============

      // Create key
      if (path === '/api/keys/create' && request.method === 'POST') {
        const { username, adminKey, note, duration } = await request.json();
        const admin = await verifyAdmin(env, username, adminKey);
        if (!admin) return jsonResponse({ error: 'Unauthorized' }, 401);

        const key = generateKey();
        const keyData = {
          key,
          note: note || '',
          hwid: null,
          createdAt: Date.now(),
          createdBy: admin.username,
          duration: duration || 30,
          expiresAt: Date.now() + (duration || 30) * 24 * 60 * 60 * 1000,
          used: false,
          usedBy: null
        };

        await env.KEYS.put(key, JSON.stringify(keyData));
        return jsonResponse({ success: true, key: keyData });
      }

      // List keys
      if (path === '/api/keys/list' && request.method === 'POST') {
        console.log('Keys list request received');
        const { username, adminKey } = await request.json();
        console.log('Body parsed:', username);
        const admin = await verifyAdmin(env, username, adminKey);
        if (!admin) {
          console.log('Admin verification failed');
          return jsonResponse({ error: 'Unauthorized' }, 401);
        }
        console.log('Admin verified, fetching keys...');

        const keysList = await env.KEYS.list();
        console.log('Keys list count:', keysList.keys.length);
        const keys = [];
        for (const key of keysList.keys) {
          const data = await env.KEYS.get(key.name);
          if (data) keys.push(JSON.parse(data));
        }
        console.log('Returning keys:', keys.length);
        return jsonResponse({ keys });
      }

      // Delete key
      if (path === '/api/keys/delete' && request.method === 'POST') {
        const { username, adminKey, key } = await request.json();
        const admin = await verifyAdmin(env, username, adminKey);
        if (!admin) return jsonResponse({ error: 'Unauthorized' }, 401);

        await env.KEYS.delete(key);
        return jsonResponse({ success: true });
      }

      // Extend key
      if (path === '/api/keys/extend' && request.method === 'POST') {
        const { username, adminKey, key, additionalDays } = await request.json();
        const admin = await verifyAdmin(env, username, adminKey);
        if (!admin) return jsonResponse({ error: 'Unauthorized' }, 401);

        const keyData = await env.KEYS.get(key);
        if (!keyData) return jsonResponse({ error: 'Key not found' }, 404);

        const parsed = JSON.parse(keyData);
        parsed.duration += additionalDays;
        parsed.expiresAt += additionalDays * 24 * 60 * 60 * 1000;
        await env.KEYS.put(key, JSON.stringify(parsed));
        return jsonResponse({ success: true, key: parsed });
      }

      // ============ CHAT ============

      if (path === '/api/chat/messages' && request.method === 'GET') {
        const messages = await env.CHAT.get('messages');
        return jsonResponse({ messages: messages ? JSON.parse(messages) : [] });
      }

      if (path === '/api/chat/send' && request.method === 'POST') {
        const { token, message, isAdmin, username: adminUsername, adminKey, replyTo } = await request.json();

        if (!message || !message.trim()) {
          return jsonResponse({ error: 'Message required' }, 400);
        }

        let sender = null;

        if (isAdmin) {
          const admin = await verifyAdmin(env, adminUsername, adminKey);
          if (!admin) return jsonResponse({ error: 'Unauthorized' }, 401);
          sender = { username: admin.username, role: admin.role, isAdmin: true };
        } else {
          const session = await env.USERS.get(`session_${token}`);
          if (!session) return jsonResponse({ error: 'Unauthorized' }, 401);
          const { username } = JSON.parse(session);
          const userData = await env.USERS.get(`user_${username.toLowerCase()}`);
          const user = userData ? JSON.parse(userData) : null;
          sender = { username, role: user?.role || 'user', isAdmin: false };
        }

        const messagesData = await env.CHAT.get('messages');
        const messages = messagesData ? JSON.parse(messagesData) : [];
        
        const newMessage = {
          id: generateId(),
          username: sender.username,
          message: message.trim(),
          timestamp: Date.now(),
          role: sender.role,
          isAdmin: sender.isAdmin,
          replyTo: replyTo || null
        };

        messages.push(newMessage);
        if (messages.length > 200) messages.shift();

        await env.CHAT.put('messages', JSON.stringify(messages));
        return jsonResponse({ success: true, message: newMessage });
      }

      if (path === '/api/chat/delete' && request.method === 'POST') {
        const { username, adminKey, messageId } = await request.json();
        const admin = await verifyAdmin(env, username, adminKey);
        if (!admin) return jsonResponse({ error: 'Unauthorized' }, 401);

        const messagesData = await env.CHAT.get('messages');
        if (!messagesData) return jsonResponse({ error: 'No messages' }, 404);

        const messages = JSON.parse(messagesData);
        const filtered = messages.filter(m => m.id !== messageId);
        await env.CHAT.put('messages', JSON.stringify(filtered));
        return jsonResponse({ success: true });
      }

      // ============ CONFIGS ============

      if (path === '/api/configs/list' && request.method === 'GET') {
        const configsList = await env.CONFIGS.list();
        const configs = [];
        for (const config of configsList.keys) {
          const data = await env.CONFIGS.get(config.name);
          if (data) {
            const parsed = JSON.parse(data);
            // Don't send full content in list
            configs.push({ ...parsed, content: undefined });
          }
        }
        return jsonResponse({ configs });
      }

      if (path === '/api/configs/upload' && request.method === 'POST') {
        const { token, name, description, game, fileData, fileName } = await request.json();
        
        const session = await env.USERS.get(`session_${token}`);
        if (!session) return jsonResponse({ error: 'Unauthorized' }, 401);

        const { username } = JSON.parse(session);
        
        const configId = generateId();
        const config = {
          id: configId,
          name,
          description,
          game,
          author: username,
          content: fileData,
          fileName,
          downloads: 0,
          likes: 0,
          createdAt: Date.now()
        };

        await env.CONFIGS.put(configId, JSON.stringify(config));
        return jsonResponse({ success: true, config: { ...config, content: undefined } });
      }

      if (path === '/api/configs/download' && request.method === 'POST') {
        const { configId } = await request.json();
        
        const configData = await env.CONFIGS.get(configId);
        if (!configData) return jsonResponse({ error: 'Config not found' }, 404);

        const config = JSON.parse(configData);
        config.downloads++;
        await env.CONFIGS.put(configId, JSON.stringify(config));

        return jsonResponse({ success: true, config });
      }

      if (path === '/api/configs/delete' && request.method === 'POST') {
        const { token, configId } = await request.json();
        
        const session = await env.USERS.get(`session_${token}`);
        if (!session) return jsonResponse({ error: 'Unauthorized' }, 401);

        const { username } = JSON.parse(session);
        const configData = await env.CONFIGS.get(configId);
        if (!configData) return jsonResponse({ error: 'Config not found' }, 404);

        const config = JSON.parse(configData);
        if (config.author !== username) return jsonResponse({ error: 'Not your config' }, 403);

        await env.CONFIGS.delete(configId);
        return jsonResponse({ success: true });
      }

      // ============ NEWS ============

      if (path === '/api/news/list' && request.method === 'GET') {
        const newsList = await env.NEWS.list();
        const news = [];
        for (const item of newsList.keys) {
          const data = await env.NEWS.get(item.name);
          if (data) news.push(JSON.parse(data));
        }
        news.sort((a, b) => b.createdAt - a.createdAt);
        return jsonResponse({ news });
      }

      if (path === '/api/news/create' && request.method === 'POST') {
        const { username, adminKey, title, content, important } = await request.json();
        const admin = await verifyAdmin(env, username, adminKey);
        if (!admin) return jsonResponse({ error: 'Unauthorized' }, 401);

        const newsId = generateId();
        const news = {
          id: newsId,
          title,
          content,
          author: admin.username,
          important: important || false,
          createdAt: Date.now()
        };

        await env.NEWS.put(newsId, JSON.stringify(news));
        return jsonResponse({ success: true, news });
      }

      if (path === '/api/news/delete' && request.method === 'POST') {
        const { username, adminKey, newsId } = await request.json();
        const admin = await verifyAdmin(env, username, adminKey);
        if (!admin) return jsonResponse({ error: 'Unauthorized' }, 401);

        await env.NEWS.delete(newsId);
        return jsonResponse({ success: true });
      }

      // ============ LOADERS ============

      if (path === '/api/loaders/list' && request.method === 'GET') {
        const loadersList = await env.LOADERS.list();
        const loaders = [];
        for (const item of loadersList.keys) {
          const data = await env.LOADERS.get(item.name);
          if (data) loaders.push(JSON.parse(data));
        }
        loaders.sort((a, b) => b.createdAt - a.createdAt);
        return jsonResponse({ loaders });
      }

      if (path === '/api/loaders/upload' && request.method === 'POST') {
        const { username, adminKey, version, changelog, fileData, fileName, isCurrent } = await request.json();
        const admin = await verifyAdmin(env, username, adminKey);
        if (!admin) return jsonResponse({ error: 'Unauthorized' }, 401);

        // If setting as current, unset others
        if (isCurrent) {
          const loadersList = await env.LOADERS.list();
          for (const item of loadersList.keys) {
            const data = await env.LOADERS.get(item.name);
            if (data) {
              const loader = JSON.parse(data);
              loader.isCurrent = false;
              await env.LOADERS.put(item.name, JSON.stringify(loader));
            }
          }
        }

        const loaderId = generateId();
        const loader = {
          id: loaderId,
          version,
          changelog,
          downloadUrl: fileData,
          fileName,
          isCurrent: isCurrent || false,
          uploadedBy: admin.username,
          createdAt: Date.now()
        };

        await env.LOADERS.put(loaderId, JSON.stringify(loader));
        return jsonResponse({ success: true, loader });
      }

      if (path === '/api/loaders/set-current' && request.method === 'POST') {
        const { username, adminKey, loaderId } = await request.json();
        const admin = await verifyAdmin(env, username, adminKey);
        if (!admin) return jsonResponse({ error: 'Unauthorized' }, 401);

        // Unset all others
        const loadersList = await env.LOADERS.list();
        for (const item of loadersList.keys) {
          const data = await env.LOADERS.get(item.name);
          if (data) {
            const loader = JSON.parse(data);
            loader.isCurrent = false;
            await env.LOADERS.put(item.name, JSON.stringify(loader));
          }
        }

        // Set current
        const loaderData = await env.LOADERS.get(loaderId);
        if (!loaderData) return jsonResponse({ error: 'Loader not found' }, 404);

        const loader = JSON.parse(loaderData);
        loader.isCurrent = true;
        await env.LOADERS.put(loaderId, JSON.stringify(loader));

        return jsonResponse({ success: true });
      }

      if (path === '/api/loaders/delete' && request.method === 'POST') {
        const { username, adminKey, loaderId } = await request.json();
        const admin = await verifyAdmin(env, username, adminKey);
        if (!admin) return jsonResponse({ error: 'Unauthorized' }, 401);

        await env.LOADERS.delete(loaderId);
        return jsonResponse({ success: true });
      }

      // ============ ORDERS ============

      if (path === '/api/orders/create' && request.method === 'POST') {
        try {
          const body = await request.json();
          const { username, discord, paymentMethod, amount } = body;

          if (!username || !paymentMethod || !amount) {
            return jsonResponse({ error: 'Missing required fields', fields: { username, paymentMethod, amount } }, 400);
          }

          const orderId = generateId();
          const order = {
            id: orderId,
            username,
            discord: discord || null,
            paymentMethod,
            amount,
            status: 'pending',
            key: null,
            createdAt: Date.now()
          };

          await env.ORDERS.put(orderId, JSON.stringify(order));

          return jsonResponse({ success: true, order });
        } catch (e) {
          console.error('Order create error:', e);
          return jsonResponse({ error: 'Failed to create order', details: e.message }, 500);
        }
      }

      if (path === '/api/orders/list' && request.method === 'POST') {
        const { username, adminKey } = await request.json();
        const admin = await verifyAdmin(env, username, adminKey);
        if (!admin) return jsonResponse({ error: 'Unauthorized' }, 401);

        const ordersList = await env.ORDERS.list();
        const orders = [];
        for (const item of ordersList.keys) {
          const data = await env.ORDERS.get(item.name);
          if (data) orders.push(JSON.parse(data));
        }
        orders.sort((a, b) => b.createdAt - a.createdAt);
        return jsonResponse({ orders });
      }

      if (path === '/api/orders/update' && request.method === 'POST') {
        const { username, adminKey, orderId, status, key } = await request.json();
        const admin = await verifyAdmin(env, username, adminKey);
        if (!admin) return jsonResponse({ error: 'Unauthorized' }, 401);

        const orderData = await env.ORDERS.get(orderId);
        if (!orderData) return jsonResponse({ error: 'Order not found' }, 404);

        const order = JSON.parse(orderData);
        order.status = status;
        if (key) order.key = key;

        await env.ORDERS.put(orderId, JSON.stringify(order));
        return jsonResponse({ success: true, order });
      }

      // Confirm payment and auto-generate key
      if (path === '/api/orders/confirm' && request.method === 'POST') {
        const { username, adminKey, orderId, planDays } = await request.json();
        const admin = await verifyAdmin(env, username, adminKey);
        if (!admin) return jsonResponse({ error: 'Unauthorized' }, 401);

        const orderData = await env.ORDERS.get(orderId);
        if (!orderData) return jsonResponse({ error: 'Order not found' }, 404);

        const order = JSON.parse(orderData);
        if (order.status !== 'pending') {
          return jsonResponse({ error: 'Order already processed' }, 400);
        }

        // Auto-generate key
        const newKey = generateKey();
        const duration = (planDays || 30) * 24 * 60 * 60 * 1000; // Convert days to ms
        const keyData = {
          key: newKey,
          note: `Order ${orderId}`,
          hwid: null,
          createdAt: Date.now(),
          createdBy: admin.username,
          duration: duration,
          expiresAt: Date.now() + duration,
          used: false,
          usedBy: null
        };

        await env.KEYS.put(newKey, JSON.stringify(keyData));

        // Update order
        order.status = 'completed';
        order.key = newKey;
        order.planDays = planDays || 30;
        await env.ORDERS.put(orderId, JSON.stringify(order));

        return jsonResponse({ 
          success: true, 
          order,
          generatedKey: newKey 
        });
      }

      // ============ STATS ============

      if (path === '/api/stats' && request.method === 'POST') {
        const { username, adminKey } = await request.json();
        const admin = await verifyAdmin(env, username, adminKey);
        if (!admin) return jsonResponse({ error: 'Unauthorized' }, 401);

        const [users, keys, orders] = await Promise.all([
          env.USERS.list(),
          env.KEYS.list(),
          env.ORDERS.list()
        ]);

        let activeKeys = 0;
        for (const key of keys.keys) {
          const data = await env.KEYS.get(key.name);
          if (data) {
            const parsed = JSON.parse(data);
            if (!parsed.used || Date.now() < parsed.expiresAt) activeKeys++;
          }
        }

        let pendingOrders = 0;
        for (const order of orders.keys) {
          const data = await env.ORDERS.get(order.name);
          if (data) {
            const parsed = JSON.parse(data);
            if (parsed.status === 'pending') pendingOrders++;
          }
        }

        return jsonResponse({
          success: true,
          stats: {
            totalUsers: users.keys.filter(k => k.name.startsWith('user_')).length,
            totalKeys: keys.keys.length,
            activeKeys,
            totalOrders: orders.keys.length,
            pendingOrders
          }
        });
      }

      // 404
      return jsonResponse({ error: 'Not found' }, 404);

    } catch (err) {
      console.error('Worker error:', err);
      console.error('Error stack:', err.stack);
      return jsonResponse({ 
        error: 'Internal server error', 
        details: err.message,
        stack: err.stack,
        path: path 
      }, 500);
    }
  }
};
