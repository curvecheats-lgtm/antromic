'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { usersApi, keysApi, adminApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Users,
  Plus,
  Search,
  Shield,
  Rocket,
  Video,
  Award,
  Key,
  MoreHorizontal,
  Trash2,
  Ban,
  CheckCircle,
  User,
  RefreshCw,
  Copy,
  Check,
  Eye,
  EyeOff,
  Info,
} from 'lucide-react';

// Role definitions with icons and colors
const ROLES = {
  owner: { icon: Shield, color: 'bg-red-500/20 text-red-500 border-red-500/30', label: 'Owner' },
  admin: { icon: Shield, color: 'bg-red-500/20 text-red-500 border-red-500/30', label: 'Admin' },
  booster: { icon: Rocket, color: 'bg-purple-500/20 text-purple-500 border-purple-500/30', label: 'Booster' },
  media: { icon: Video, color: 'bg-pink-500/20 text-pink-500 border-pink-500/30', label: 'Media' },
  og: { icon: Award, color: 'bg-green-500/20 text-green-500 border-green-500/30', label: 'OG' },
  user: { icon: User, color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30', label: 'User' },
};

type RoleKey = keyof typeof ROLES;

interface UserData {
  id: string;
  username: string;
  role?: RoleKey;
  key: string | null;
  keyExpiry: number | null;
  keyStatus: 'active' | 'expired' | 'none';
  status?: 'active' | 'banned';
  createdAt: number;
  createdBy?: string;
  hwid: string | null;
}

function RoleBadge({ role }: { role: RoleKey }) {
  const roleConfig = ROLES[role] || ROLES.user;
  const Icon = roleConfig.icon;
  
  return (
    <Badge variant="outline" className={`${roleConfig.color} border flex items-center gap-1`}>
      <Icon className="w-3 h-3" />
      {roleConfig.label}
    </Badge>
  );
}

function StatusBadge({ status }: { status: 'active' | 'banned' | 'expired' }) {
  const statusConfig = {
    active: { color: 'bg-green-500/20 text-green-500 border-green-500/30', label: 'Active' },
    banned: { color: 'bg-red-500/20 text-red-500 border-red-500/30', label: 'Banned' },
    expired: { color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30', label: 'Expired' },
  };
  
  return (
    <Badge variant="outline" className={`${statusConfig[status].color} border`}>
      {statusConfig[status].label}
    </Badge>
  );
}

export default function UsersPage() {
  const { adminKey, adminUsername } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copied, setCopied] = useState<string | null>(null);
  
  // Create user dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<RoleKey>('user');
  const [creating, setCreating] = useState(false);
  
  // Create key dialog
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);
  const [keyDuration, setKeyDuration] = useState('30');
  const [keyCount, setKeyCount] = useState('1');
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([]);

  // User details dialog
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [selectedUserDetails, setSelectedUserDetails] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchUsers = async () => {
    if (!adminKey || !adminUsername) return;
    setLoading(true);
    try {
      const result = await usersApi.list(adminUsername, adminKey);
      if (result.users) {
        setUsers(result.users);
      }
    } catch (error) {
      console.error('Failed to fetch users');
      toast.error('Failed to fetch users');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [adminKey, adminUsername]);

  const handleCreateUser = async () => {
    if (!adminKey || !adminUsername || !newUsername || !newPassword) return;
    setCreating(true);
    try {
      const result = await usersApi.create(adminUsername, adminKey, newUsername, newPassword, newRole);
      if (result.success) {
        toast.success(`User ${newUsername} created successfully`);
        setCreateDialogOpen(false);
        setNewUsername('');
        setNewPassword('');
        setNewRole('user');
        fetchUsers();
      } else {
        toast.error(result.error || 'Failed to create user');
      }
    } catch (error) {
      toast.error('Failed to create user');
    }
    setCreating(false);
  };

  const handleGenerateKeys = async () => {
    if (!adminKey || !adminUsername) return;
    const count = parseInt(keyCount) || 1;
    const duration = parseInt(keyDuration) || 30;
    const keys: string[] = [];
    
    try {
      for (let i = 0; i < count; i++) {
        const result = await keysApi.create(adminUsername, adminKey, 'Generated via admin panel', duration);
        if (result.success && result.key) {
          keys.push(result.key.key);
        }
      }
      setGeneratedKeys(keys);
      toast.success(`Generated ${keys.length} key(s)`);
    } catch (error) {
      toast.error('Failed to generate keys');
    }
  };

  const handleUpdateRole = async (userId: string, role: RoleKey) => {
    if (!adminKey || !adminUsername) return;
    try {
      const result = await usersApi.updateRole(adminUsername, adminKey, userId, role);
      if (result.success) {
        toast.success('Role updated');
        fetchUsers();
      } else {
        toast.error(result.error || 'Failed to update role');
      }
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const handleBanUser = async (userId: string) => {
    if (!adminKey || !adminUsername) return;
    try {
      const result = await usersApi.setStatus(adminUsername, adminKey, userId, 'banned');
      if (result.success) {
        toast.success('User banned');
        fetchUsers();
      }
    } catch (error) {
      toast.error('Failed to ban user');
    }
  };

  const handleUnbanUser = async (userId: string) => {
    if (!adminKey || !adminUsername) return;
    try {
      const result = await usersApi.setStatus(adminUsername, adminKey, userId, 'active');
      if (result.success) {
        toast.success('User unbanned');
        fetchUsers();
      }
    } catch (error) {
      toast.error('Failed to unban user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!adminKey || !adminUsername) return;
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const result = await usersApi.delete(adminUsername, adminKey, userId);
      if (result.success) {
        toast.success('User deleted');
        fetchUsers();
      }
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const copyKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopied(key);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleViewUserDetails = async (userId: string) => {
    if (!adminKey || !adminUsername) return;
    setLoadingDetails(true);
    setShowPassword(false);
    try {
      const result = await adminApi.getUserDetails(adminUsername, adminKey, userId);
      if (result.success && result.user) {
        setSelectedUserDetails(result.user);
        setUserDetailsOpen(true);
      } else {
        toast.error(result.error || 'Failed to load user details');
      }
    } catch (error) {
      toast.error('Failed to load user details');
    }
    setLoadingDetails(false);
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.username.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.status !== 'banned') ||
      (statusFilter === 'banned' && user.status === 'banned');
    return matchesSearch && matchesRole && matchesStatus;
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getUserStatus = (user: UserData): 'active' | 'banned' | 'expired' => {
    if (user.status === 'banned') return 'banned';
    if (user.keyStatus === 'expired') return 'expired';
    return 'active';
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            User Management
          </h1>
          <p className="text-muted-foreground">Manage users, roles, and keys</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {/* Generate Keys Dialog */}
          <Dialog open={keyDialogOpen} onOpenChange={setKeyDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Key className="w-4 h-4 mr-2" />
                Generate Keys
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Generate License Keys</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">Number of Keys</label>
                  <Input
                    type="number"
                    value={keyCount}
                    onChange={(e) => setKeyCount(e.target.value)}
                    min="1"
                    max="50"
                    className="bg-input"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Duration (days)</label>
                  <Select value={keyDuration} onValueChange={setKeyDuration}>
                    <SelectTrigger className="bg-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 Days</SelectItem>
                      <SelectItem value="30">30 Days</SelectItem>
                      <SelectItem value="90">90 Days</SelectItem>
                      <SelectItem value="365">1 Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleGenerateKeys} className="w-full bg-primary hover:bg-primary/90">
                  Generate
                </Button>
                {generatedKeys.length > 0 && (
                  <div className="mt-4">
                    <label className="text-sm text-muted-foreground mb-2 block">Generated Keys:</label>
                    <div className="bg-input rounded-lg p-3 space-y-1 max-h-48 overflow-y-auto">
                      {generatedKeys.map((key, i) => (
                        <div key={i} className="font-mono text-xs text-foreground flex items-center justify-between">
                          <span>{key}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyKey(key)}
                            className="h-6 px-2"
                          >
                            {copied === key ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedKeys.join('\n'));
                        toast.success('All keys copied');
                      }}
                    >
                      Copy All
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          
          {/* Create User Dialog */}
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Create User
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">Username</label>
                  <Input
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Username"
                    className="bg-input"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Password</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Password"
                    className="bg-input"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Role</label>
                  <Select value={newRole} onValueChange={(v) => setNewRole(v as RoleKey)}>
                    <SelectTrigger className="bg-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ROLES).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <config.icon className="w-3 h-3" />
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleCreateUser}
                  disabled={creating || !newUsername || !newPassword}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {creating ? 'Creating...' : 'Create User'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="bg-input pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40 bg-input">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {Object.entries(ROLES).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-input">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold text-foreground">{users.length}</p>
              </div>
              <Users className="w-8 h-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-500">
                  {users.filter(u => u.status !== 'banned' && u.keyStatus !== 'expired').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Banned</p>
                <p className="text-2xl font-bold text-red-500">
                  {users.filter(u => u.status === 'banned').length}
                </p>
              </div>
              <Ban className="w-8 h-8 text-red-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">With Keys</p>
                <p className="text-2xl font-bold text-primary">{users.filter(u => u.key).length}</p>
              </div>
              <Key className="w-8 h-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">User</TableHead>
                <TableHead className="text-muted-foreground">Role</TableHead>
                <TableHead className="text-muted-foreground">Key</TableHead>
                <TableHead className="text-muted-foreground">Expiry</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Created</TableHead>
                <TableHead className="text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-border">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium text-foreground">{user.username}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={user.role || 'user'} />
                    </TableCell>
                    <TableCell>
                      {user.key ? (
                        <code className="font-mono text-xs bg-input px-2 py-1 rounded">
                          {user.key.substring(0, 8)}...
                        </code>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.keyExpiry ? formatDate(user.keyExpiry) : '-'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={getUserStatus(user)} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-border">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleViewUserDetails(user.id)}>
                            <Info className="w-4 h-4 mr-2 text-blue-500" />
                            View Full Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 'booster')}>
                            <Rocket className="w-4 h-4 mr-2 text-purple-500" />
                            Set Booster
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 'media')}>
                            <Video className="w-4 h-4 mr-2 text-pink-500" />
                            Set Media
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 'og')}>
                            <Award className="w-4 h-4 mr-2 text-green-500" />
                            Set OG
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 'user')}>
                            <User className="w-4 h-4 mr-2" />
                            Set User
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.status === 'banned' ? (
                            <DropdownMenuItem onClick={() => handleUnbanUser(user.id)}>
                              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                              Unban User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleBanUser(user.id)}>
                              <Ban className="w-4 h-4 mr-2 text-yellow-500" />
                              Ban User
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={userDetailsOpen} onOpenChange={setUserDetailsOpen}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              User Details
            </DialogTitle>
          </DialogHeader>
          
          {loadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : selectedUserDetails ? (
            <div className="space-y-4">
              {/* User ID */}
              <div className="bg-secondary/50 rounded-lg p-3 border border-border/50">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">User ID</label>
                <p className="font-mono text-xs text-foreground break-all">{selectedUserDetails.id}</p>
              </div>

              {/* Username */}
              <div className="bg-secondary/50 rounded-lg p-3 border border-border/50">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Username</label>
                <p className="font-medium text-foreground">{selectedUserDetails.username}</p>
              </div>

              {/* Password Hash - Admin Only */}
              <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/30">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-red-500 uppercase tracking-wider flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Password Hash (Admin Only)
                  </label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowPassword(!showPassword)}
                    className="h-6 px-2"
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </Button>
                </div>
                {showPassword ? (
                  <p className="font-mono text-xs text-foreground break-all">{selectedUserDetails.password}</p>
                ) : (
                  <p className="font-mono text-xs text-muted-foreground">•••••••••••••••••••••••••••••</p>
                )}
              </div>

              {/* Key */}
              <div className="bg-secondary/50 rounded-lg p-3 border border-border/50">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">License Key</label>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-xs text-foreground">{selectedUserDetails.key || 'No key assigned'}</code>
                  {selectedUserDetails.key && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyKey(selectedUserDetails.key)}
                      className="h-6 px-2"
                    >
                      {copied === selectedUserDetails.key ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    </Button>
                  )}
                </div>
              </div>

              {/* HWID */}
              <div className="bg-secondary/50 rounded-lg p-3 border border-border/50">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">HWID</label>
                <p className="font-mono text-xs text-foreground break-all">{selectedUserDetails.hwid || 'Not set'}</p>
              </div>

              {/* Role & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary/50 rounded-lg p-3 border border-border/50">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Role</label>
                  <p className="text-sm text-foreground capitalize">{selectedUserDetails.role || 'user'}</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3 border border-border/50">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Status</label>
                  <p className="text-sm text-foreground capitalize">{selectedUserDetails.status || 'active'}</p>
                </div>
              </div>

              {/* Created */}
              <div className="bg-secondary/50 rounded-lg p-3 border border-border/50">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Created</label>
                <p className="text-sm text-foreground">{formatDate(selectedUserDetails.createdAt)}</p>
                {selectedUserDetails.createdBy && (
                  <p className="text-xs text-muted-foreground">By: {selectedUserDetails.createdBy}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No user selected</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
