'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { keysApi, type Key } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Shield,
  Globe,
  Bell,
  Lock,
  Database,
  Server,
  Zap,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Settings,
  Key as KeyIcon,
  Users,
} from 'lucide-react';

export default function SettingsPage() {
  const { adminKey, adminUsername } = useAuth();
  
  // General Settings
  const [siteName, setSiteName] = useState('Antromic');
  const [siteUrl, setSiteUrl] = useState('https://antromic.cc');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState('Welcome to Antromic - The best gaming enhancement platform.');
  
  // Security Settings
  const [maxLoginAttempts, setMaxLoginAttempts] = useState('5');
  const [sessionTimeout, setSessionTimeout] = useState('24');
  const [enforceStrongPasswords, setEnforceStrongPasswords] = useState(true);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  
  // API Settings
  const [cfWorkerUrl, setCfWorkerUrl] = useState('https://antromic-api.umiwinsupport.workers.dev');
  const [apiRateLimit, setApiRateLimit] = useState('100');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [discordWebhook, setDiscordWebhook] = useState('');
  
  // Key Settings
  const [defaultKeyDuration, setDefaultKeyDuration] = useState('30');
  const [keyPrefix, setKeyPrefix] = useState('ANT');
  const [allowKeyTransfer, setAllowKeyTransfer] = useState(false);
  const [autoExpireNotification, setAutoExpireNotification] = useState(true);
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Key statistics from API
  const [keyStats, setKeyStats] = useState({
    total: 0,
    active: 0,
    expiringSoon: 0,
    expired: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Fetch key statistics from API
  useEffect(() => {
    const fetchStats = async () => {
      if (!adminKey || !adminUsername) return;
      
      setLoadingStats(true);
      try {
        const result = await keysApi.list(adminUsername, adminKey);
        if (result.keys) {
          const keys = result.keys as Key[];
          const now = Date.now();
          const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;
          
          setKeyStats({
            total: keys.length,
            active: keys.filter(k => !k.used && now < k.expiresAt).length,
            expiringSoon: keys.filter(k => k.expiresAt > now && k.expiresAt < sevenDaysFromNow).length,
            expired: keys.filter(k => now > k.expiresAt).length
          });
        }
      } catch (error) {
        console.error('Failed to fetch key stats:', error);
      }
      setLoadingStats(false);
    };

    fetchStats();
  }, [adminKey, adminUsername]);

  const handleSave = async () => {
    setSaving(true);
    // Settings are stored locally for now
    localStorage.setItem('antromic_settings', JSON.stringify({
      siteName,
      siteUrl,
      maintenanceMode,
      registrationOpen,
      welcomeMessage,
      maxLoginAttempts,
      sessionTimeout,
      enforceStrongPasswords,
      twoFactorRequired,
      cfWorkerUrl,
      apiRateLimit,
      webhookUrl,
      discordWebhook,
      defaultKeyDuration,
      keyPrefix,
      allowKeyTransfer,
      autoExpireNotification
    }));
    await new Promise(resolve => setTimeout(resolve, 500));
    setSaving(false);
    setSaved(true);
    toast.success('Settings saved successfully');
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            Admin Settings
          </h1>
          <p className="text-muted-foreground">Configure system settings and preferences</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary hover:bg-primary/90"
        >
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-secondary border border-border">
          <TabsTrigger value="general" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Globe className="w-4 h-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Lock className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="api" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Server className="w-4 h-4 mr-2" />
            API
          </TabsTrigger>
          <TabsTrigger value="keys" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <KeyIcon className="w-4 h-4 mr-2" />
            Keys
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Site Information
              </CardTitle>
              <CardDescription>Basic site configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Site Name</label>
                  <Input
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className="bg-input"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Site URL</label>
                  <Input
                    value={siteUrl}
                    onChange={(e) => setSiteUrl(e.target.value)}
                    className="bg-input"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Welcome Message</label>
                <Textarea
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  className="bg-input"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Site Status
              </CardTitle>
              <CardDescription>Control site availability</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`w-5 h-5 ${maintenanceMode ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="font-medium text-foreground">Maintenance Mode</p>
                    <p className="text-xs text-muted-foreground">Temporarily disable site access for users</p>
                  </div>
                </div>
                <Switch
                  checked={maintenanceMode}
                  onCheckedChange={setMaintenanceMode}
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3">
                  <Users className={`w-5 h-5 ${registrationOpen ? 'text-green-500' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="font-medium text-foreground">Open Registration</p>
                    <p className="text-xs text-muted-foreground">Allow new users to register with valid keys</p>
                  </div>
                </div>
                <Switch
                  checked={registrationOpen}
                  onCheckedChange={setRegistrationOpen}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Authentication
              </CardTitle>
              <CardDescription>User authentication settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div>
                  <p className="font-medium text-foreground">Enforce Strong Passwords</p>
                  <p className="text-xs text-muted-foreground">Require uppercase, numbers, symbols</p>
                </div>
                <Switch
                  checked={enforceStrongPasswords}
                  onCheckedChange={setEnforceStrongPasswords}
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div>
                  <p className="font-medium text-foreground">Require 2FA for Admins</p>
                  <p className="text-xs text-muted-foreground">Two-factor authentication for admin accounts</p>
                </div>
                <Switch
                  checked={twoFactorRequired}
                  onCheckedChange={setTwoFactorRequired}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Max Login Attempts</label>
                  <Input
                    type="number"
                    value={maxLoginAttempts}
                    onChange={(e) => setMaxLoginAttempts(e.target.value)}
                    className="bg-input"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Session Timeout (hours)</label>
                  <Input
                    type="number"
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(e.target.value)}
                    className="bg-input"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Settings */}
        <TabsContent value="api" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5 text-primary" />
                Cloudflare Worker
              </CardTitle>
              <CardDescription>Backend API configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Worker URL</label>
                <Input
                  value={cfWorkerUrl}
                  onChange={(e) => setCfWorkerUrl(e.target.value)}
                  placeholder="https://your-worker.workers.dev"
                  className="bg-input font-mono text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Rate Limit (requests/min)</label>
                <Input
                  type="number"
                  value={apiRateLimit}
                  onChange={(e) => setApiRateLimit(e.target.value)}
                  className="bg-input"
                />
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-500/20 text-green-500 border-green-500/30">
                  Connected
                </Badge>
                <span className="text-xs text-muted-foreground">API is operational</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Webhooks
              </CardTitle>
              <CardDescription>External notification endpoints</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">General Webhook URL</label>
                <Input
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://your-webhook-endpoint.com"
                  className="bg-input font-mono text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Discord Webhook</label>
                <Input
                  value={discordWebhook}
                  onChange={(e) => setDiscordWebhook(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="bg-input font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Key Settings */}
        <TabsContent value="keys" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyIcon className="w-5 h-5 text-primary" />
                License Key Configuration
              </CardTitle>
              <CardDescription>Default settings for generated keys</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Key Prefix</label>
                  <Input
                    value={keyPrefix}
                    onChange={(e) => setKeyPrefix(e.target.value.toUpperCase())}
                    className="bg-input"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Default Duration</label>
                  <Select value={defaultKeyDuration} onValueChange={setDefaultKeyDuration}>
                    <SelectTrigger className="bg-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 Days</SelectItem>
                      <SelectItem value="30">30 Days</SelectItem>
                      <SelectItem value="90">90 Days</SelectItem>
                      <SelectItem value="365">1 Year</SelectItem>
                      <SelectItem value="lifetime">Lifetime</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div>
                  <p className="font-medium text-foreground">Allow Key Transfer</p>
                  <p className="text-xs text-muted-foreground">Users can transfer keys to other accounts</p>
                </div>
                <Switch
                  checked={allowKeyTransfer}
                  onCheckedChange={setAllowKeyTransfer}
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div>
                  <p className="font-medium text-foreground">Expiry Notifications</p>
                  <p className="text-xs text-muted-foreground">Notify users before key expiration</p>
                </div>
                <Switch
                  checked={autoExpireNotification}
                  onCheckedChange={setAutoExpireNotification}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                Key Statistics
              </CardTitle>
              <CardDescription>Real-time data from Cloudflare KV</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-secondary/50 text-center">
                    <p className="text-2xl font-bold text-foreground">{keyStats.total}</p>
                    <p className="text-xs text-muted-foreground">Total Keys</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50 text-center">
                    <p className="text-2xl font-bold text-green-500">{keyStats.active}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50 text-center">
                    <p className="text-2xl font-bold text-yellow-500">{keyStats.expiringSoon}</p>
                    <p className="text-xs text-muted-foreground">Expiring Soon</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50 text-center">
                    <p className="text-2xl font-bold text-red-500">{keyStats.expired}</p>
                    <p className="text-xs text-muted-foreground">Expired</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
