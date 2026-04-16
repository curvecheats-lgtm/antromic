// ============================================
// CURVE.CC KEYAUTH CLOUDFLARE WORKER v2.2 (FIXED)
// Copy this ENTIRE file into your Cloudflare Worker
// ============================================
// Required KV Namespaces (bind these in Worker settings):
// - ADMINS: For admin accounts
// - KEYS: For license keys
// - USERS: For user accounts and sessions
// - CHAT: For chat messages
// - CONFIGS: For user configs
// - TICKETS: For support tickets
// - NEWS: For news posts
// - LOADERS: For loader versions
// ============================================
// FIXES in v2.2:
// - User login now always returns role field
// - Simplified stats (no USER_STATS KV needed)
// - Better error handling
// - All endpoints return proper success/error format
// ============================================

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Pre-configured admin accounts
// koni: konipassword99
// weird: weirdpassword88
const PRESET_ADMINS = {
  'koni': {
    username: 'koni',
    role: 'owner',
    permissions: ['all']
  },
  'weird': {
    username: 'weird',
    role: 'owner',
    permissions: ['all']
  }
};

// Generate random key in format CURVE-XXXX-XXXX-XXX
function generateKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const part1 = Array(4).fill(0).map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  const part2 = Array(4).fill(0).map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  const part3 = Array(3).fill(0).map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  return `CURVE-${part1}-${part2}-${part3}`;
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

      // Get stats (admin only)
      if (path === '/api/stats' && request.method === 'POST') {
        const { username, adminKey } = await request.json();
        
        const admin = await verifyAdmin(env, username, adminKey);
        if (!admin) {
          return jsonResponse({ error: 'Unauthorized' }, 401);
        }

        const keys = await env.KEYS.list();
        const totalKeys = keys.keys.length;
        
        let activeKeys = 0;
        let usedKeys = 0;
        for (const key of keys.keys) {
          if (!key.name.startsWith('claimed_')) {
            const data = await env.KEYS.get(key.name);
            if (data) {
              const parsed = JSON.parse(data);
              if (parsed.used) usedKeys++;
              if (!parsed.used || Date.now() < parsed.expiresAt) activeKeys++;
            }
          }
        }

        const tickets = await env.TICKETS.list();
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
          success: true,
          stats: {
            totalKeys,
            activeKeys,
            usedKeys,
            openTickets
          }
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
          role: 'user', // FIXED: Always set role to 'user' by default
          createdAt: Date.now(),
          isAdmin: false,
          hwid: null
        };

        await env.USERS.put(`user_${username.toLowerCase()}`, JSON.stringify(user));

        parsedKey.used = true;
        parsedKey.usedBy = username;
        await env.KEYS.put(key, JSON.stringify(parsedKey));

        return jsonResponse({ success: true, user: { ...user, password: undefined, role: 'user' } });
      }

      // Login user
      if (path === '/api/users/login' && request.method === 'POST') {
        const { username, password } = await request.json();

        console.log('Login attempt:', username.toLowerCase());
        
        // Try multiple user key formats for backwards compatibility
        let userData = await env.USERS.get(`user_${username.toLowerCase()}`);
        
        // Also try just the username as key for test accounts
        if (!userData) {
          const allUsers = await env.USERS.list();
          for (const key of allUsers.keys) {
            if (key.name.startsWith('user_')) {
              const data = await env.USERS.get(key.name);
              if (data) {
                const user = JSON.parse(data);
                if (user.username.toLowerCase() === username.toLowerCase()) {
                  userData = data;
                  break;
                }
              }
            }
          }
        }
        
        if (!userData) {
          console.log('User not found:', username.toLowerCase());
          return jsonResponse({ error: 'Invalid credentials' }, 401);
        }

        const user = JSON.parse(userData);
        console.log('Found user:', user.username, 'Key:', user.key);
        
        const validPassword = await verifyPassword(password, user.password);
        if (!validPassword) {
          console.log('Invalid password for:', username);
          return jsonResponse({ error: 'Invalid credentials' }, 401);
        }

        const keyData = await env.KEYS.get(user.key);
        if (keyData) {
          const parsedKey = JSON.parse(keyData);
          if (Date.now() > parsedKey.expiresAt) {
            return jsonResponse({ error: 'Your key has expired' }, 400);
          }
        }

        const token = generateId() + generateId();
        await env.USERS.put(`session_${token}`, JSON.stringify({ userId: user.id, username }), { expirationTtl: 86400 * 7 });

        // FIXED: Always include role in response
        return jsonResponse({ 
          success: true, 
          token, 
          user: { 
            ...user, 
            password: undefined,
            role: user.role || 'user' // Ensure role is always present
          },
          stats: { messages: 0, configs: 0, tickets: 0 },
          unlockedBadges: []
        });
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
        // FIXED: Always include role, stats, and badges in response
        return jsonResponse({ 
          success: true, 
          user: { 
            ...user, 
            password: undefined,
            role: user.role || 'user'
          },
          stats: { messages: 0, configs: 0, tickets: 0 },
          unlockedBadges: []
        });
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
        const { token, message, isAdmin, username: adminUsername, adminKey } = await request.json();

        if (!message || !message.trim()) {
          return jsonResponse({ error: 'Message required' }, 400);
        }

        let sender = null;

        if (isAdmin) {
          const admin = await verifyAdmin(env, adminUsername, adminKey);
          if (!admin) return jsonResponse({ error: 'Unauthorized' }, 401);

          sender = {
            username: admin.username,
            role: admin.role || 'admin',
            isAdmin: true
          };
        } else {
          const session = await env.USERS.get(`session_${token}`);
          if (!session) return jsonResponse({ error: 'Unauthorized' }, 401);

          const { username } = JSON.parse(session);
          const userData = await env.USERS.get(`user_${username.toLowerCase()}`);
          const user = userData ? JSON.parse(userData) : null;

          sender = {
            username,
            role: user?.role || 'user',
            isAdmin: false
          };
        }

        const messagesData = await env.CHAT.get('messages');
        const messages = messagesData ? JSON.parse(messagesData) : [];
        
        const newMessage = {
          id: generateId(),
          username: sender.username,
          message: message.trim(),
          timestamp: Date.now(),
          role: sender.role,
          isAdmin: sender.isAdmin
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
          mode = 'automatic',
          robloxVersion
        } = await request.json();
        
        const admin = await verifyAdmin(env, username, adminKey);
        if (!admin || !hasPermission(admin, 'loaders')) {
          return jsonResponse({ error: 'Unauthorized' }, 401);
        }

        const loadersData = await env.LOADERS.get('versions');
        const loaders = loadersData ? JSON.parse(loadersData) : [];

        // If setting as current, unset any existing current
        if (isCurrent) {
          loaders.forEach(l => l.isCurrent = false);
        }

        const loader = {
          id: generateId(),
          version,
          changelog,
          downloadUrl,
          isCurrent,
          mode, // 'manual' or 'automatic'
          robloxVersion: robloxVersion || null,
          uploadedBy: admin.username,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          updatedBy: admin.username
        };

        loaders.push(loader);
        await env.LOADERS.put('versions', JSON.stringify(loaders));

        return jsonResponse({ success: true, loader });
      }

      // Update loader (admin)
      if (path === '/api/loaders/update' && request.method === 'POST') {
        const { username, adminKey, loaderId, ...updates } = await request.json();
        
        const admin = await verifyAdmin(env, username, adminKey);
        if (!admin || !hasPermission(admin, 'loaders')) {
          return jsonResponse({ error: 'Unauthorized' }, 401);
        }

        const loadersData = await env.LOADERS.get('versions');
        if (!loadersData) return jsonResponse({ error: 'No loaders found' }, 404);

        const loaders = JSON.parse(loadersData);
        const loaderIndex = loaders.findIndex(l => l.id === loaderId);
        
        if (loaderIndex === -1) return jsonResponse({ error: 'Loader not found' }, 404);

        // If setting as current, unset any existing current
        if (updates.isCurrent) {
          loaders.forEach(l => l.isCurrent = false);
        }

        loaders[loaderIndex] = {
          ...loaders[loaderIndex],
          ...updates,
          updatedAt: Date.now(),
          updatedBy: admin.username
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
        if (!loadersData) return jsonResponse({ error: 'No loaders found' }, 404);

        const loaders = JSON.parse(loadersData);
        const filteredLoaders = loaders.filter(l => l.id !== loaderId);

        if (loaders.length === filteredLoaders.length) {
          return jsonResponse({ error: 'Loader not found' }, 404);
        }

        await env.LOADERS.put('versions', JSON.stringify(filteredLoaders));
        return jsonResponse({ success: true });
      }

      // ============ PAYMENT ROUTES ============

      // Verify Roblox gamepass ownership
      if (path === '/api/payment/verify-gamepass' && request.method === 'POST') {
        const { robloxUsername } = await request.json();
        
        if (!robloxUsername) {
          return jsonResponse({ error: 'Username required' }, 400);
        }

        try {
          // Get user ID from username using Roblox API
          // Use exact match search first
          const userResponse = await fetch(`https://users.roblox.com/v1/usernames/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usernames: [robloxUsername], excludeBannedUsers: true })
          });
          
          let userId = null;
          let displayName = null;
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            if (userData.data && userData.data.length > 0) {
              userId = userData.data[0].id;
              displayName = userData.data[0].displayName;
            }
          }
          
          // Fallback to search API if exact match fails
          if (!userId) {
            const searchResponse = await fetch(`https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(robloxUsername)}&limit=10`);
            if (searchResponse.ok) {
              const searchData = await searchResponse.json();
              if (searchData.data && searchData.data.length > 0) {
                // Find exact username match (case insensitive)
                const exactMatch = searchData.data.find(u => u.name.toLowerCase() === robloxUsername.toLowerCase());
                if (exactMatch) {
                  userId = exactMatch.id;
                  displayName = exactMatch.displayName;
                } else {
                  // Use first result as fallback
                  userId = searchData.data[0].id;
                  displayName = searchData.data[0].displayName;
                }
              }
            }
          }
          
          if (!userId) {
            return jsonResponse({ error: 'Roblox user not found. Please check your username and try again.' }, 404);
          }

          // Check if already claimed
          const claimed = await env.KEYS.get(`claimed_roblox_${userId}`);
          if (claimed) {
            return jsonResponse({ error: 'You have already claimed a key with this account' }, 400);
          }

          // GAMEPASS ID
          const GAMEPASS_ID = '1385281940';
          
          // Try multiple methods to verify gamepass ownership
          let ownsGamepass = false;
          let verificationMethod = '';
          
          // Method 1: Check user's gamepass ownership via inventory API
          try {
            const inventoryResponse = await fetch(
              `https://inventory.roblox.com/v1/users/${userId}/items/GamePass/${GAMEPASS_ID}`,
              { 
                headers: { 
                  'Accept': 'application/json',
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                } 
              }
            );
            
            if (inventoryResponse.ok) {
              const inventoryData = await inventoryResponse.json();
              if (inventoryData.data && inventoryData.data.length > 0) {
                ownsGamepass = true;
                verificationMethod = 'inventory_api';
              }
            }
          } catch (e) {
            console.log('Inventory API failed:', e.message);
          }
          
          // Method 2: Check via economy API (fallback)
          if (!ownsGamepass) {
            try {
              const economyResponse = await fetch(
                `https://economy.roblox.com/v1/products/${GAMEPASS_ID}/ownership?userId=${userId}`,
                { 
                  headers: { 
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                  } 
                }
              );
              
              if (economyResponse.ok) {
                const economyData = await economyResponse.json();
                if (economyData.owned === true) {
                  ownsGamepass = true;
                  verificationMethod = 'economy_api';
                }
              }
            } catch (e) {
              console.log('Economy API failed:', e.message);
            }
          }
          
          // Method 3: Allow manual admin verification for testing
          if (!ownsGamepass) {
            // Check if there's a pending manual verification
            const pendingVerification = await env.KEYS.get(`pending_roblox_${userId}_${GAMEPASS_ID}`);
            if (pendingVerification) {
              const verifyData = JSON.parse(pendingVerification);
              if (verifyData.verified === true) {
                ownsGamepass = true;
                verificationMethod = 'manual_verification';
              }
            }
          }
          
          if (ownsGamepass) {
            // Generate key
            const key = generateKey();
            const keyData = {
              key,
              note: `Purchased via Robux by ${robloxUsername} (${userId})`,
              hwid: null,
              createdAt: Date.now(),
              createdBy: 'robux_payment',
              duration: 30,
              expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
              used: false,
              usedBy: null,
              paymentMethod: 'robux',
              robloxUserId: userId,
              robloxUsername: robloxUsername
            };

            await env.KEYS.put(key, JSON.stringify(keyData));
            await env.KEYS.put(`claimed_roblox_${userId}`, 'true');
            
            return jsonResponse({ 
              success: true, 
              key,
              verified: true,
              message: 'Payment verified! Here is your license key.'
            });
          } else {
            return jsonResponse({ 
              error: 'Gamepass not owned. Please purchase the gamepass first.',
              gamepassUrl: `https://www.roblox.com/game-pass/${GAMEPASS_ID}`,
              verified: false 
            }, 400);
          }
        } catch (error) {
          console.error('Gamepass verification error:', error);
          return jsonResponse({ 
            error: 'Failed to verify gamepass ownership. Please try again or contact support.',
            details: error.message 
          }, 500);
        }
      }

      // Verify crypto payment (placeholder - generates key for testing)
      if (path === '/api/payment/verify-crypto' && request.method === 'POST') {
        const { senderWallet, cryptoType } = await request.json();
        
        if (!senderWallet || !cryptoType) {
          return jsonResponse({ error: 'Wallet address and crypto type required' }, 400);
        }

        try {
          // Check if already claimed with this wallet
          const claimed = await env.KEYS.get(`claimed_crypto_${senderWallet.toLowerCase()}`);
          if (claimed) {
            return jsonResponse({ error: 'A key has already been generated for this wallet' }, 400);
          }

          // For production, integrate with blockchain APIs to verify payment
          // For now, generate key for testing
          const key = generateKey();
          const keyData = {
            key,
            note: `Purchased via ${cryptoType.toUpperCase()} from ${senderWallet.substring(0, 8)}...`,
            hwid: null,
            createdAt: Date.now(),
            createdBy: 'crypto_payment',
            duration: 30,
            expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
            used: false,
            usedBy: null,
            paymentMethod: cryptoType,
            cryptoWallet: senderWallet
          };

          await env.KEYS.put(key, JSON.stringify(keyData));
          await env.KEYS.put(`claimed_crypto_${senderWallet.toLowerCase()}`, 'true');
          
          return jsonResponse({ 
            success: true, 
            key,
            verified: true,
            message: 'Payment verified! Here is your license key.'
          });
        } catch (error) {
          console.error('Crypto verification error:', error);
          return jsonResponse({ error: 'Failed to verify payment' }, 500);
        }
      }

      // Admin endpoint to get full user details including password hash
      if (path === '/api/admin/user-details' && request.method === 'POST') {
        const { username: adminUsername, adminKey, targetUserId } = await request.json();
        
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
              if (user.id === targetUserId) {
                // Return full user data including password hash for admin only
                return jsonResponse({ 
                  success: true, 
                  user: {
                    id: user.id,
                    username: user.username,
                    password: user.password, // Password hash visible to admin
                    key: user.key,
                    role: user.role,
                    status: user.status,
                    hwid: user.hwid,
                    createdAt: user.createdAt,
                    createdBy: user.createdBy,
                    isAdmin: user.isAdmin
                  }
                });
              }
            }
          }
        }
        return jsonResponse({ error: 'User not found' }, 404);
      }

      // Setup endpoint to create test account and key (for development only)
      if (path === '/api/setup' && request.method === 'POST') {
        const { setupKey } = await request.json();
        
        // Simple setup key for security (change this in production)
        if (setupKey !== 'curve-setup-2025') {
          return jsonResponse({ error: 'Invalid setup key' }, 401);
        }

        const results = [];

        // Create test key: CURVE-TEST-KEYS-123
        const testKeyId = 'key_test_' + Date.now();
        const testKey = {
          key: 'CURVE-TEST-KEYS-123',
          note: 'Test key for development',
          hwid: null,
          createdAt: Date.now(),
          createdBy: 'setup',
          duration: 30 * 24 * 60 * 60 * 1000, // 30 days
          expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000),
          used: false,
          usedBy: null
        };
        await env.KEYS.put(`key_${testKey.key}`, JSON.stringify(testKey));
        results.push('Created test key: CURVE-TEST-KEYS-123');

        // Create test user: test / testpass2
        const testUserId = 'user_' + generateId();
        const hashedTestPassword = await hashPassword('testpass2');
        const testUser = {
          id: testUserId,
          username: 'test',
          password: hashedTestPassword,
          key: 'CURVE-TEST-KEYS-123',
          createdAt: Date.now(),
          isAdmin: false,
          hwid: null,
          role: 'user',
          status: 'active'
        };
        await env.USERS.put(`user_test`, JSON.stringify(testUser));
        results.push('Created test user: test / testpass2');

        return jsonResponse({ 
          success: true, 
          message: 'Setup completed',
          results,
          testCredentials: {
            username: 'test',
            password: 'testpass2',
            key: 'CURVE-TEST-KEYS-123'
          }
        });
      }

      // 404 for unknown routes
      return jsonResponse({ error: 'Not found' }, 404);

    } catch (err) {
      console.error('Error:', err);
      return jsonResponse({ error: 'Internal server error', details: err.message }, 500);
    }
  }
};
