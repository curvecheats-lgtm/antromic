// ============================================
// CURVE.CC KEYAUTH CLOUDFLARE WORKER v2.0
// Copy this ENTIRE file into your Cloudflare Worker
// ============================================
// Required KV Namespaces:
// - KEYS: For license keys
// - USERS: For user accounts and sessions
// - CHAT: For chat messages
// - CONFIGS: For user configs
// - TICKETS: For support tickets
// - NEWS: For news posts
// - LOADERS: For loader versions
// - ADMINS: For admin accounts
// ============================================

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Pre-configured admin accounts (hashed passwords)
// koni: konipassword99
// weird: weirdpassword88
const PRESET_ADMINS = {
  'koni': {
    username: 'koni',
    passwordHash: '5e884898da28047d55d0e1d1c3f5e23f6b3a4b0c8d9e0f1a2b3c4d5e6f7a8b9c', // Will be set on first login
    role: 'owner',
    permissions: ['all']
  },
  'weird': {
    username: 'weird',
    passwordHash: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456', // Will be set on first login
    role: 'owner',
    permissions: ['all']
  }
};

// Generate random 12-character key
function generateKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let key = '';
  for (let i = 0; i < 12; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

// Generate random ID
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Hash password using SHA-256
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'curve_salt_2024_v2');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Verify password
async function verifyPassword(password, hash) {
  const newHash = await hashPassword(password);
  return newHash === hash;
}

// JSON response helper
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

// Verify admin credentials
async function verifyAdmin(env, username, adminKey) {
  const adminData = await env.ADMINS.get(`admin_${username.toLowerCase()}`);
  if (!adminData) return null;
  
  const admin = JSON.parse(adminData);
  if (admin.adminKey !== adminKey) return null;
  
  return admin;
}

// Check if admin has permission
function hasPermission(admin, permission) {
  if (!admin) return false;
  if (admin.permissions.includes('all')) return true;
  return admin.permissions.includes(permission);
}

// Main request handler
export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // ============ HEALTH CHECK ============
      if (path === '/' || path === '/api' || path === '/api/health') {
        return jsonResponse({ 
          status: 'ok', 
          service: 'Curve.cc API',
          version: '2.0',
          timestamp: Date.now()
        });
      }

      // ============ ADMIN AUTHENTICATION ============

      // Admin login with username/password
      if (path === '/api/admin/login' && request.method === 'POST') {
        const { username, password } = await request.json();
        
        if (!username || !password) {
          return jsonResponse({ error: 'Username and password required' }, 400);
        }

        // Check if admin exists in KV
        let adminData = await env.ADMINS.get(`admin_${username.toLowerCase()}`);
        
        if (!adminData) {
          // Check if it's a preset admin (first-time login)
          const presetAdmin = PRESET_ADMINS[username.toLowerCase()];
          if (!presetAdmin) {
            return jsonResponse({ error: 'Invalid credentials' }, 401);
          }

          // Verify the preset password
          const expectedPasswords = {
            'koni': 'konipassword99',
            'weird': 'weirdpassword88'
          };

          if (password !== expectedPasswords[username.toLowerCase()]) {
            return jsonResponse({ error: 'Invalid credentials' }, 401);
          }

          // Create admin account on first login
          const hashedPassword = await hashPassword(password);
          const adminKey = generateId() + generateId();
          
          const newAdmin = {
            id: generateId(),
            username: username.toLowerCase(),
            password: hashedPassword,
            adminKey,
            role: presetAdmin.role,
            permissions: presetAdmin.permissions,
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

        // Verify existing admin password
        const admin = JSON.parse(adminData);
        const validPassword = await verifyPassword(password, admin.password);
        
        if (!validPassword) {
          return jsonResponse({ error: 'Invalid credentials' }, 401);
        }

        // Update last login
        admin.lastLogin = Date.now();
        await env.ADMINS.put(`admin_${username.toLowerCase()}`, JSON.stringify(admin));

        return jsonResponse({ 
          success: true, 
          adminKey: admin.adminKey,
          username: admin.username,
          role: admin.role
        });
      }

      // Verify admin session
      if (path === '/api/admin/verify' && request.method === 'POST') {
        const { username, adminKey } = await request.json();
        
        const admin = await verifyAdmin(env, username, adminKey);
        if (!admin) {
          return jsonResponse({ error: 'Invalid session' }, 401);
        }

        return jsonResponse({ 
          success: true,
          username: admin.username,
          role: admin.role,
          permissions: admin.permissions
        });
      }

      // ============ KEY ROUTES ============
      
      // Create a new key (admin only)
      if (path === '/api/keys/create' && request.method === 'POST') {
        const { username, adminKey, note, duration } = await request.json();
        
        const admin = await verifyAdmin(env, username, adminKey);
        if (!admin || !hasPermission(admin, 'keys')) {
          return jsonResponse({ error: 'Unauthorized' }, 401);
        }

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

      // Get all keys (admin only)
      if (path === '/api/keys/list' && request.method === 'POST') {
        const { username, adminKey } = await request.json();
        
        const admin = await verifyAdmin(env, username, adminKey);
        if (!admin || !hasPermission(admin, 'keys')) {
          return jsonResponse({ error: 'Unauthorized' }, 401);
        }

        const keys = await env.KEYS.list();
        const keyList = [];
        for (const key of keys.keys) {
          if (!key.name.startsWith('claimed_')) {
            const data = await env.KEYS.get(key.name);
            if (data) keyList.push(JSON.parse(data));
          }
        }
        return jsonResponse({ keys: keyList });
      }

      // Delete a key (admin only)
      if (path === '/api/keys/delete' && request.method === 'POST') {
        const { username, adminKey, key } = await request.json();
        
        const admin = await verifyAdmin(env, username, adminKey);
        if (!admin || !hasPermission(admin, 'keys')) {
          return jsonResponse({ error: 'Unauthorized' }, 401);
        }

        await env.KEYS.delete(key);
        return jsonResponse({ success: true });
      }

      // Reset HWID (admin only)
      if (path === '/api/keys/reset-hwid' && request.method === 'POST') {
        const { username, adminKey, key } = await request.json();
        
        const admin = await verifyAdmin(env, username, adminKey);
        if (!admin || !hasPermission(admin, 'keys')) {
          return jsonResponse({ error: 'Unauthorized' }, 401);
        }

        const keyData = await env.KEYS.get(key);
        if (!keyData) return jsonResponse({ error: 'Key not found' }, 404);

        const parsed = JSON.parse(keyData);
        parsed.hwid = null;
        await env.KEYS.put(key, JSON.stringify(parsed));
        return jsonResponse({ success: true });
      }

      // Update key note (admin only)
      if (path === '/api/keys/update-note' && request.method === 'POST') {
        const { username, adminKey, key, note } = await request.json();
        
        const admin = await verifyAdmin(env, username, adminKey);
        if (!admin || !hasPermission(admin, 'keys')) {
          return jsonResponse({ error: 'Unauthorized' }, 401);
        }

        const keyData = await env.KEYS.get(key);
        if (!keyData) return jsonResponse({ error: 'Key not found' }, 404);

        const parsed = JSON.parse(keyData);
        parsed.note = note;
        await env.KEYS.put(key, JSON.stringify(parsed));
        return jsonResponse({ success: true });
      }

      // Extend key duration (admin only)
      if (path === '/api/keys/extend' && request.method === 'POST') {
        const { username, adminKey, key, additionalDays } = await request.json();
        
        const admin = await verifyAdmin(env, username, adminKey);
        if (!admin || !hasPermission(admin, 'keys')) {
          return jsonResponse({ error: 'Unauthorized' }, 401);
        }

        const keyData = await env.KEYS.get(key);
        if (!keyData) return jsonResponse({ error: 'Key not found' }, 404);

        const parsed = JSON.parse(keyData);
        parsed.duration += additionalDays;
        parsed.expiresAt += additionalDays * 24 * 60 * 60 * 1000;
        await env.KEYS.put(key, JSON.stringify(parsed));
        return jsonResponse({ success: true, key: parsed });
      }

      // Validate key (for user login)
      if (path === '/api/keys/validate' && request.method === 'POST') {
        const { key, hwid } = await request.json();
        
        const keyData = await env.KEYS.get(key);
        if (!keyData) return jsonResponse({ error: 'Invalid key' }, 404);

        const parsed = JSON.parse(keyData);
        
        if (Date.now() > parsed.expiresAt) {
          return jsonResponse({ error: 'Key expired' }, 400);
        }

        if (parsed.hwid && parsed.hwid !== hwid) {
          return jsonResponse({ error: 'HWID mismatch' }, 400);
        }

        if (!parsed.hwid && hwid) {
          parsed.hwid = hwid;
          await env.KEYS.put(key, JSON.stringify(parsed));
        }

        return jsonResponse({ success: true, key: parsed });
      }

      // ============ USER ROUTES ============

      // Register user
      if (path === '/api/users/register' && request.method === 'POST') {
        const { username, password, key } = await request.json();

        const keyData = await env.KEYS.get(key);
        if (!keyData) return jsonResponse({ error: 'Invalid key' }, 400);

        const parsedKey = JSON.parse(keyData);
        if (parsedKey.used) return jsonResponse({ error: 'Key already used' }, 400);
        if (Date.now() > parsedKey.expiresAt) return jsonResponse({ error: 'Key expired' }, 400);

        const existingUser = await env.USERS.get(`user_${username.toLowerCase()}`);
        if (existingUser) return jsonResponse({ error: 'Username taken' }, 400);

        const hashedPassword = await hashPassword(password);
        const user = {
          id: generateId(),
          username,
          password: hashedPassword,
          key,
          createdAt: Date.now(),
          isAdmin: false,
          hwid: null
        };

        await env.USERS.put(`user_${username.toLowerCase()}`, JSON.stringify(user));

        parsedKey.used = true;
        parsedKey.usedBy = username;
        await env.KEYS.put(key, JSON.stringify(parsedKey));

        return jsonResponse({ success: true, user: { ...user, password: undefined } });
      }

      // Login user
      if (path === '/api/users/login' && request.method === 'POST') {
        const { username, password } = await request.json();

        const userData = await env.USERS.get(`user_${username.toLowerCase()}`);
        if (!userData) return jsonResponse({ error: 'Invalid credentials' }, 401);

        const user = JSON.parse(userData);
        const validPassword = await verifyPassword(password, user.password);
        if (!validPassword) return jsonResponse({ error: 'Invalid credentials' }, 401);

        const keyData = await env.KEYS.get(user.key);
        if (keyData) {
          const parsedKey = JSON.parse(keyData);
          if (Date.now() > parsedKey.expiresAt) {
            return jsonResponse({ error: 'Your key has expired' }, 400);
          }
        }

        const token = generateId() + generateId();
        await env.USERS.put(`session_${token}`, JSON.stringify({ userId: user.id, username }), { expirationTtl: 86400 * 7 });

        return jsonResponse({ success: true, token, user: { ...user, password: undefined } });
      }

      // Verify session
      if (path === '/api/users/verify' && request.method === 'POST') {
        const { token } = await request.json();
        
        const session = await env.USERS.get(`session_${token}`);
        if (!session) return jsonResponse({ error: 'Invalid session' }, 401);

        const { username } = JSON.parse(session);
        const userData = await env.USERS.get(`user_${username.toLowerCase()}`);
        if (!userData) return jsonResponse({ error: 'User not found' }, 404);

        const user = JSON.parse(userData);
        return jsonResponse({ success: true, user: { ...user, password: undefined } });
      }

      // ============ USER MANAGEMENT (Admin) ============

      // List all users (admin only)
      if (path === '/api/users/list' && request.method === 'POST') {
        const { username, adminKey } = await request.json();
        
        const admin = await verifyAdmin(env, username, adminKey);
        if (!admin || !hasPermission(admin, 'users')) {
          return jsonResponse({ error: 'Unauthorized' }, 401);
        }

        const usersList = await env.USERS.list();
        const users = [];
        for (const user of usersList.keys) {
          if (user.name.startsWith('user_')) {
            const data = await env.USERS.get(user.name);
            if (data) {
              const parsed = JSON.parse(data);
              // Get key info for this user
              let keyExpiry = null;
              let keyStatus = 'none';
              if (parsed.key) {
                const keyData = await env.KEYS.get(parsed.key);
                if (keyData) {
                  const parsedKey = JSON.parse(keyData);
                  keyExpiry = parsedKey.expiresAt;
                  keyStatus = Date.now() > parsedKey.expiresAt ? 'expired' : 'active';
                }
              }
              users.push({
                ...parsed,
                password: undefined,
                keyExpiry,
                keyStatus
              });
            }
          }
        }
        return jsonResponse({ users });
      }

      // Create user (admin only)
      if (path === '/api/users/create' && request.method === 'POST') {
        const { username: adminUsername, adminKey, newUsername, password, role } = await request.json();
        
        const admin = await verifyAdmin(env, adminUsername, adminKey);
        if (!admin || !hasPermission(admin, 'users')) {
          return jsonResponse({ error: 'Unauthorized' }, 401);
        }

        if (!newUsername || !password) {
          return jsonResponse({ error: 'Username and password required' }, 400);
        }

        const existingUser = await env.USERS.get(`user_${newUsername.toLowerCase()}`);
        if (existingUser) return jsonResponse({ error: 'Username taken' }, 400);

        // Create a new key for this user
        const key = generateKey();
        const keyData = {
          key,
          note: `Created for ${newUsername} by admin`,
          hwid: null,
          createdAt: Date.now(),
          createdBy: admin.username,
          duration: 30,
          expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
          used: true,
          usedBy: newUsername
        };
        await env.KEYS.put(key, JSON.stringify(keyData));

        const hashedPassword = await hashPassword(password);
        const user = {
          id: generateId(),
          username: newUsername,
          password: hashedPassword,
          key,
          role: role || 'user',
          createdAt: Date.now(),
          createdBy: admin.username,
          isAdmin: false,
          hwid: null,
          status: 'active'
        };

        await env.USERS.put(`user_${newUsername.toLowerCase()}`, JSON.stringify(user));

        return jsonResponse({ 
          success: true, 
          user: { ...user, password: undefined },
          key: keyData
        });
      }

      // Update user role (admin only)
      if (path === '/api/users/update-role' && request.method === 'POST') {
        const { username: adminUsername, adminKey, userId, role } = await request.json();
        
        const admin = await verifyAdmin(env, adminUsername, adminKey);
        if (!admin || !hasPermission(admin, 'users')) {
          return jsonResponse({ error: 'Unauthorized' }, 401);
        }

        // Find user by id
        const usersList = await env.USERS.list();
        for (const userKey of usersList.keys) {
          if (userKey.name.startsWith('user_')) {
            const data = await env.USERS.get(userKey.name);
            if (data) {
              const user = JSON.parse(data);
              if (user.id === userId) {
                user.role = role;
                await env.USERS.put(userKey.name, JSON.stringify(user));
                return jsonResponse({ success: true, user: { ...user, password: undefined } });
              }
            }
          }
        }
        return jsonResponse({ error: 'User not found' }, 404);
      }

      // Ban/Unban user (admin only)
      if (path === '/api/users/set-status' && request.method === 'POST') {
        const { username: adminUsername, adminKey, userId, status } = await request.json();
        
        const admin = await verifyAdmin(env, adminUsername, adminKey);
        if (!admin || !hasPermission(admin, 'users')) {
          return jsonResponse({ error: 'Unauthorized' }, 401);
        }

        const usersList = await env.USERS.list();
        for (const userKey of usersList.keys) {
          if (userKey.name.startsWith('user_')) {
            const data = await env.USERS.get(userKey.name);
            if (data) {
              const user = JSON.parse(data);
              if (user.id === userId) {
                user.status = status;
                await env.USERS.put(userKey.name, JSON.stringify(user));
                return jsonResponse({ success: true, user: { ...user, password: undefined } });
              }
            }
          }
        }
        return jsonResponse({ error: 'User not found' }, 404);
      }

      // Delete user (admin only)
      if (path === '/api/users/delete' && request.method === 'POST') {
        const { username: adminUsername, adminKey, userId } = await request.json();
        
        const admin = await verifyAdmin(env, adminUsername, adminKey);
        if (!admin || !hasPermission(admin, 'users')) {
          return jsonResponse({ error: 'Unauthorized' }, 401);
        }

        const usersList = await env.USERS.list();
        for (const userKey of usersList.keys) {
          if (userKey.name.startsWith('user_')) {
            const data = await env.USERS.get(userKey.name);
            if (data) {
              const user = JSON.parse(data);
              if (user.id === userId) {
                await env.USERS.delete(userKey.name);
                // Also delete any sessions for this user
                const sessionsList = await env.USERS.list({ prefix: 'session_' });
                for (const session of sessionsList.keys) {
                  const sessionData = await env.USERS.get(session.name);
                  if (sessionData) {
                    const parsed = JSON.parse(sessionData);
                    if (parsed.username.toLowerCase() === user.username.toLowerCase()) {
                      await env.USERS.delete(session.name);
                    }
                  }
                }
                return jsonResponse({ success: true });
              }
            }
          }
        }
        return jsonResponse({ error: 'User not found' }, 404);
      }

      // Bind key to user (admin only)
      if (path === '/api/users/bind-key' && request.method === 'POST') {
        const { username: adminUsername, adminKey, userId, keyId, duration } = await request.json();
        
        const admin = await verifyAdmin(env, adminUsername, adminKey);
        if (!admin || !hasPermission(admin, 'users')) {
          return jsonResponse({ error: 'Unauthorized' }, 401);
        }

        const usersList = await env.USERS.list();
        for (const userKey of usersList.keys) {
          if (userKey.name.startsWith('user_')) {
            const data = await env.USERS.get(userKey.name);
            if (data) {
              const user = JSON.parse(data);
              if (user.id === userId) {
                // Create or update key
                const key = keyId || generateKey();
                const durationDays = duration || 30;
                const keyData = {
                  key,
                  note: `Bound to ${user.username} by admin`,
                  hwid: user.hwid,
                  createdAt: Date.now(),
                  createdBy: admin.username,
                  duration: durationDays,
                  expiresAt: Date.now() + durationDays * 24 * 60 * 60 * 1000,
                  used: true,
                  usedBy: user.username
                };
                await env.KEYS.put(key, JSON.stringify(keyData));
                
                user.key = key;
                await env.USERS.put(userKey.name, JSON.stringify(user));
                
                return jsonResponse({ 
                  success: true, 
                  user: { ...user, password: undefined },
                  key: keyData 
                });
              }
            }
          }
        }
        return jsonResponse({ error: 'User not found' }, 404);
      }

      // ============ CHAT ROUTES ============

      if (path === '/api/chat/messages' && request.method === 'GET') {
        const messages = await env.CHAT.get('messages');
        return jsonResponse({ messages: messages ? JSON.parse(messages) : [] });
      }

      if (path === '/api/chat/send' && request.method === 'POST') {
        const { token, message } = await request.json();
        
        const session = await env.USERS.get(`session_${token}`);
        if (!session) return jsonResponse({ error: 'Unauthorized' }, 401);

        const { username } = JSON.parse(session);
        
        const messagesData = await env.CHAT.get('messages');
        const messages = messagesData ? JSON.parse(messagesData) : [];
        
        const newMessage = {
          id: generateId(),
          username,
          message,
          timestamp: Date.now()
        };

        messages.push(newMessage);
        if (messages.length > 100) messages.shift();

        await env.CHAT.put('messages', JSON.stringify(messages));
        return jsonResponse({ success: true, message: newMessage });
      }

      // ============ CONFIG ROUTES ============

      if (path === '/api/configs/list' && request.method === 'GET') {
        const configsList = await env.CONFIGS.list();
        const configs = [];
        for (const config of configsList.keys) {
          const data = await env.CONFIGS.get(config.name);
          if (data) configs.push(JSON.parse(data));
        }
        return jsonResponse({ configs });
      }

      if (path === '/api/configs/upload' && request.method === 'POST') {
        const { token, name, description, content, game } = await request.json();
        
        const session = await env.USERS.get(`session_${token}`);
        if (!session) return jsonResponse({ error: 'Unauthorized' }, 401);

        const { username } = JSON.parse(session);
        
        const configId = generateId();
        const config = {
          id: configId,
          name,
          description,
          content,
          game,
          author: username,
          downloads: 0,
          likes: 0,
          createdAt: Date.now()
        };

        await env.CONFIGS.put(configId, JSON.stringify(config));
        return jsonResponse({ success: true, config });
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

      // ============ TICKET ROUTES ============

      if (path === '/api/tickets/create' && request.method === 'POST') {
        const { token, subject, message } = await request.json();
        
        const session = await env.USERS.get(`session_${token}`);
        if (!session) return jsonResponse({ error: 'Unauthorized' }, 401);

        const { username } = JSON.parse(session);

        const existingTicket = await env.TICKETS.get(`user_ticket_${username}`);
        if (existingTicket) return jsonResponse({ error: 'You already have an open ticket' }, 400);

        const ticketId = generateId();
        const ticket = {
          id: ticketId,
          username,
          subject,
          messages: [{ from: username, message, timestamp: Date.now() }],
          status: 'open',
          createdAt: Date.now()
        };

        await env.TICKETS.put(ticketId, JSON.stringify(ticket));
        await env.TICKETS.put(`user_ticket_${username}`, ticketId);

        return jsonResponse({ success: true, ticket });
      }

      if (path === '/api/tickets/my-ticket' && request.method === 'POST') {
        const { token } = await request.json();
        
        const session = await env.USERS.get(`session_${token}`);
        if (!session) return jsonResponse({ error: 'Unauthorized' }, 401);

        const { username } = JSON.parse(session);
        
        const ticketId = await env.TICKETS.get(`user_ticket_${username}`);
        if (!ticketId) return jsonResponse({ ticket: null });

        const ticketData = await env.TICKETS.get(ticketId);
        return jsonResponse({ ticket: ticketData ? JSON.parse(ticketData) : null });
      }

      if (path === '/api/tickets/reply' && request.method === 'POST') {
        const { token, ticketId, message, isAdmin, username: adminUsername, adminKey } = await request.json();
        
        let senderName;
        if (isAdmin) {
          const admin = await verifyAdmin(env, adminUsername, adminKey);
          if (!admin) return jsonResponse({ error: 'Unauthorized' }, 401);
          senderName = `${admin.username} (Admin)`;
        } else {
          const session = await env.USERS.get(`session_${token}`);
          if (!session) return jsonResponse({ error: 'Unauthorized' }, 401);
          senderName = JSON.parse(session).username;
        }

        const ticketData = await env.TICKETS.get(ticketId);
        if (!ticketData) return jsonResponse({ error: 'Ticket not found' }, 404);

        const ticket = JSON.parse(ticketData);
        ticket.messages.push({ from: senderName, message, timestamp: Date.now() });
        await env.TICKETS.put(ticketId, JSON.stringify(ticket));

        return jsonResponse({ success: true, ticket });
      }

      if (path === '/api/tickets/list' && request.method === 'POST') {
        const { username, adminKey } = await request.json();
        
        const admin = await verifyAdmin(env, username, adminKey);
        if (!admin || !hasPermission(admin, 'tickets')) {
          return jsonResponse({ error: 'Unauthorized' }, 401);
        }

        const ticketsList = await env.TICKETS.list();
        const tickets = [];
        for (const ticket of ticketsList.keys) {
          if (!ticket.name.startsWith('user_ticket_')) {
            const data = await env.TICKETS.get(ticket.name);
            if (data) tickets.push(JSON.parse(data));
          }
        }
        return jsonResponse({ tickets });
      }

      if (path === '/api/tickets/close' && request.method === 'POST') {
        const { username, adminKey, ticketId } = await request.json();
        
        const admin = await verifyAdmin(env, username, adminKey);
        if (!admin || !hasPermission(admin, 'tickets')) {
          return jsonResponse({ error: 'Unauthorized' }, 401);
        }

        const ticketData = await env.TICKETS.get(ticketId);
        if (!ticketData) return jsonResponse({ error: 'Ticket not found' }, 404);

        const ticket = JSON.parse(ticketData);
        ticket.status = 'closed';
        await env.TICKETS.put(ticketId, JSON.stringify(ticket));

        await env.TICKETS.delete(`user_ticket_${ticket.username}`);

        return jsonResponse({ success: true });
      }

      // ============ NEWS ROUTES ============

      if (path === '/api/news/list' && request.method === 'GET') {
        const newsData = await env.NEWS.get('posts');
        return jsonResponse({ news: newsData ? JSON.parse(newsData) : [] });
      }

      if (path === '/api/news/create' && request.method === 'POST') {
        const { username, adminKey, title, content } = await request.json();
        
        const admin = await verifyAdmin(env, username, adminKey);
        if (!admin || !hasPermission(admin, 'news')) {
          return jsonResponse({ error: 'Unauthorized' }, 401);
        }

        const newsData = await env.NEWS.get('posts');
        const news = newsData ? JSON.parse(newsData) : [];

        const post = {
          id: generateId(),
          title,
          content,
          author: admin.username,
          createdAt: Date.now()
        };

        news.unshift(post);
        await env.NEWS.put('posts', JSON.stringify(news));

        return jsonResponse({ success: true, post });
      }

      // ============ LOADER ROUTES ============

      if (path === '/api/loaders/list' && request.method === 'GET') {
        const loadersData = await env.LOADERS.get('versions');
        return jsonResponse({ loaders: loadersData ? JSON.parse(loadersData) : [] });
      }

      // Upload loader (admin) - supports manual and automatic modes
      if (path === '/api/loaders/upload' && request.method === 'POST') {
        const { 
          username, 
          adminKey, 
          version, 
          changelog, 
          downloadUrl, 
          isCurrent,
          mode, // 'manual' or 'automatic'
          robloxVersion // Required if mode is 'manual'
        } = await request.json();
        
        const admin = await verifyAdmin(env, username, adminKey);
        if (!admin || !hasPermission(admin, 'loaders')) {
          return jsonResponse({ error: 'Unauthorized' }, 401);
        }

        const loadersData = await env.LOADERS.get('versions');
        const loaders = loadersData ? JSON.parse(loadersData) : [];

        // If this is current, unset all others
        if (isCurrent) {
          loaders.forEach(l => l.isCurrent = false);
        }

        const loader = {
          id: generateId(),
          version,
          changelog,
          downloadUrl,
          isCurrent: isCurrent || false,
          mode: mode || 'automatic',
          robloxVersion: mode === 'manual' ? robloxVersion : null,
          uploadedBy: admin.username,
          createdAt: Date.now()
        };

        loaders.unshift(loader);
        await env.LOADERS.put('versions', JSON.stringify(loaders));

        return jsonResponse({ success: true, loader });
      }

      // Update loader (admin)
      if (path === '/api/loaders/update' && request.method === 'POST') {
        const { 
          username, 
          adminKey, 
          loaderId,
          version, 
          changelog, 
          downloadUrl, 
          isCurrent,
          mode,
          robloxVersion
        } = await request.json();
        
        const admin = await verifyAdmin(env, username, adminKey);
        if (!admin || !hasPermission(admin, 'loaders')) {
          return jsonResponse({ error: 'Unauthorized' }, 401);
        }

        const loadersData = await env.LOADERS.get('versions');
        const loaders = loadersData ? JSON.parse(loadersData) : [];

        const loaderIndex = loaders.findIndex(l => l.id === loaderId);
        if (loaderIndex === -1) {
          return jsonResponse({ error: 'Loader not found' }, 404);
        }

        // If this is becoming current, unset all others
        if (isCurrent) {
          loaders.forEach(l => l.isCurrent = false);
        }

        loaders[loaderIndex] = {
          ...loaders[loaderIndex],
          version: version || loaders[loaderIndex].version,
          changelog: changelog !== undefined ? changelog : loaders[loaderIndex].changelog,
          downloadUrl: downloadUrl || loaders[loaderIndex].downloadUrl,
          isCurrent: isCurrent !== undefined ? isCurrent : loaders[loaderIndex].isCurrent,
          mode: mode || loaders[loaderIndex].mode,
          robloxVersion: mode === 'manual' ? robloxVersion : loaders[loaderIndex].robloxVersion,
          updatedBy: admin.username,
          updatedAt: Date.now()
        };

        await env.LOADERS.put('versions', JSON.stringify(loaders));
        return jsonResponse({ success: true, loader: loaders[loaderIndex] });
      }

      // Delete loader (admin)
      if (path === '/api/loaders/delete' && request.method === 'POST') {
        const { username, adminKey, loaderId } = await request.json();
        
        const admin = await verifyAdmin(env, username, adminKey);
        if (!admin || !hasPermission(admin, 'loaders')) {
          return jsonResponse({ error: 'Unauthorized' }, 401);
        }

        const loadersData = await env.LOADERS.get('versions');
        const loaders = loadersData ? JSON.parse(loadersData) : [];

        const filteredLoaders = loaders.filter(l => l.id !== loaderId);
        await env.LOADERS.put('versions', JSON.stringify(filteredLoaders));

        return jsonResponse({ success: true });
      }

      // ============ PAYMENT VERIFICATION ============

      // Verify Roblox Gamepass Purchase
      if (path === '/api/payment/verify-gamepass' && request.method === 'POST') {
        const { robloxUsername } = await request.json();
        
        try {
          // Get user ID from username
          const userResponse = await fetch(`https://users.roblox.com/v1/usernames/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usernames: [robloxUsername] })
          });
          const userData = await userResponse.json();
          
          if (!userData.data || userData.data.length === 0) {
            return jsonResponse({ error: 'Roblox user not found' }, 404);
          }

          const userId = userData.data[0].id;

          // Check if user owns the gamepass
          const gamepassId = '1385281940';
          const ownershipResponse = await fetch(
            `https://inventory.roblox.com/v1/users/${userId}/items/GamePass/${gamepassId}`
          );
          const ownershipData = await ownershipResponse.json();

          if (ownershipData.data && ownershipData.data.length > 0) {
            // Check if this user already claimed a key
            const claimed = await env.KEYS.get(`claimed_roblox_${userId}`);
            if (claimed) {
              return jsonResponse({ error: 'You have already claimed a key with this account', verified: false }, 400);
            }

            // User owns gamepass - generate key
            const key = generateKey();
            const keyData = {
              key,
              note: `Purchased via Roblox by ${robloxUsername}`,
              hwid: null,
              createdAt: Date.now(),
              createdBy: 'System (Roblox)',
              duration: 30,
              expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
              used: false,
              usedBy: null
            };

            await env.KEYS.put(key, JSON.stringify(keyData));
            await env.KEYS.put(`claimed_roblox_${userId}`, 'true');
            return jsonResponse({ success: true, key, verified: true });
          } else {
            return jsonResponse({ error: 'Gamepass not owned. Please purchase first.', verified: false }, 400);
          }
        } catch (error) {
          return jsonResponse({ error: 'Failed to verify purchase' }, 500);
        }
      }

      // Verify Crypto Payment
      if (path === '/api/payment/verify-crypto' && request.method === 'POST') {
        const { senderWallet, cryptoType } = await request.json();
        
        const wallets = {
          btc: 'bc1q6ut7d7rmfvjq9fsh8cd8gumtdpys0jsq5gcq2m',
          eth: '0x433a9e59Da4C02216b28E0847d60fd8B25563a70',
          ltc: 'LQbFLZ3jFo7yc9uGNozHmpGSUQkXgMUvxq'
        };

        try {
          let verified = false;

          if (cryptoType === 'eth') {
            const response = await fetch(
              `https://api.etherscan.io/api?module=account&action=txlist&address=${wallets.eth}&startblock=0&endblock=99999999&sort=desc`
            );
            const data = await response.json();
            
            if (data.result && Array.isArray(data.result)) {
              verified = data.result.some(tx => 
                tx.from.toLowerCase() === senderWallet.toLowerCase() &&
                tx.to.toLowerCase() === wallets.eth.toLowerCase()
              );
            }
          } else if (cryptoType === 'btc') {
            const response = await fetch(
              `https://blockchain.info/rawaddr/${wallets.btc}`
            );
            const data = await response.json();
            
            if (data.txs) {
              verified = data.txs.some(tx =>
                tx.inputs.some(input => 
                  input.prev_out && input.prev_out.addr === senderWallet
                )
              );
            }
          } else if (cryptoType === 'ltc') {
            const response = await fetch(
              `https://api.blockcypher.com/v1/ltc/main/addrs/${wallets.ltc}`
            );
            const data = await response.json();
            
            if (data.txrefs) {
              verified = data.txrefs.length > 0;
            }
          }

          if (verified) {
            const claimed = await env.KEYS.get(`claimed_${cryptoType}_${senderWallet}`);
            if (claimed) {
              return jsonResponse({ error: 'This wallet has already claimed a key', verified: false }, 400);
            }

            const key = generateKey();
            const keyData = {
              key,
              note: `Purchased via ${cryptoType.toUpperCase()} from ${senderWallet.substring(0, 10)}...`,
              hwid: null,
              createdAt: Date.now(),
              createdBy: 'System (Crypto)',
              duration: 30,
              expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
              used: false,
              usedBy: null
            };

            await env.KEYS.put(key, JSON.stringify(keyData));
            await env.KEYS.put(`claimed_${cryptoType}_${senderWallet}`, 'true');

            return jsonResponse({ success: true, key, verified: true });
          } else {
            return jsonResponse({ 
              error: 'Payment not found. Please send payment first and wait for confirmation.',
              verified: false 
            }, 400);
          }
        } catch (error) {
          return jsonResponse({ error: 'Failed to verify payment: ' + error.message }, 500);
        }
      }

      // ============ STATS ROUTES (Admin) ============
      if (path === '/api/stats' && request.method === 'POST') {
        const { username, adminKey } = await request.json();
        
        const admin = await verifyAdmin(env, username, adminKey);
        if (!admin) {
          return jsonResponse({ error: 'Unauthorized' }, 401);
        }

        // Get counts
        const keys = await env.KEYS.list();
        const tickets = await env.TICKETS.list();

        let keyCount = 0;
        let activeKeys = 0;
        let usedKeys = 0;
        
        for (const key of keys.keys) {
          if (!key.name.startsWith('claimed_')) {
            keyCount++;
            const data = await env.KEYS.get(key.name);
            if (data) {
              const parsed = JSON.parse(data);
              if (parsed.used) usedKeys++;
              else if (Date.now() < parsed.expiresAt) activeKeys++;
            }
          }
        }

        let openTickets = 0;
        for (const ticket of tickets.keys) {
          if (!ticket.name.startsWith('user_ticket_')) {
            const data = await env.TICKETS.get(ticket.name);
            if (data) {
              const parsed = JSON.parse(data);
              if (parsed.status === 'open') openTickets++;
            }
          }
        }

        return jsonResponse({
          totalKeys: keyCount,
          activeKeys,
          usedKeys,
          openTickets
        });
      }

      // ============ DEFAULT ============
      
      return jsonResponse({ 
        error: 'Not found', 
        path,
        hint: 'Visit /api/health to check API status'
      }, 404);

    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({ error: error.message || 'Internal server error' }, 500);
    }
  }
};
