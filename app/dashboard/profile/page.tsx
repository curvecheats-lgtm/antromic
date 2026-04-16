'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  User, 
  Save, 
  Link as LinkIcon,
  AtSign,
  AlertCircle,
  CheckCircle2,
  Edit3,
  Lock,
  Sparkles
} from 'lucide-react';
import { ROLES, BADGES, USERNAME_COLORS, RESERVED_USERNAMES, type RoleKey, type BadgeKey } from '@/lib/roles';

interface UserProfile {
  username: string;
  displayName: string | null;
  bio: string;
  links: string[];
  embeds: { title: string; url: string; image?: string }[];
  role: RoleKey;
  badges: BadgeKey[];
  joinedAt: string;
  profilePicture?: string;
  banner?: string;
  unlockedBadges?: BadgeKey[];
  stats?: {
    messages?: number;
    configs?: number;
  };
  key?: string;
  keyExpiry?: string;
}

export default function ProfilePage() {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [links, setLinks] = useState<string[]>(['']);
  const [embeds, setEmbeds] = useState<{ title: string; url: string; image?: string }[]>([]);
  const [error, setError] = useState('');
  const [selectedBadges, setSelectedBadges] = useState<BadgeKey[]>([]);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // Get role from user object or default to 'user'
      const userRole = user?.role || 'user';
      
      const mockProfile: UserProfile = {
        username: user?.username || '',
        displayName: null,
        bio: '',
        links: [],
        embeds: [],
        role: userRole as RoleKey,
        joinedAt: new Date(user?.createdAt || Date.now()).toISOString(),
        key: user?.key,
        keyExpiry: undefined,
        badges: [],
        unlockedBadges: [],
        stats: { messages: 0, configs: 0 },
      };
      setProfile(mockProfile);
      setDisplayName(mockProfile.displayName || '');
      setBio(mockProfile.bio);
      setLinks(mockProfile.links.length > 0 ? mockProfile.links : ['']);
      setEmbeds(mockProfile.embeds);
    } catch (error) {
      toast.error('Failed to load profile');
    }
    setLoading(false);
  };

  const handleAddLink = () => {
    if (links.length < 5) {
      setLinks([...links, '']);
    }
  };

  const handleRemoveLink = (index: number) => {
    const newLinks = links.filter((_, i) => i !== index);
    if (newLinks.length === 0) newLinks.push('');
    setLinks(newLinks);
  };

  const handleLinkChange = (index: number, value: string) => {
    const newLinks = [...links];
    newLinks[index] = value;
    setLinks(newLinks);
  };

  const validateDisplayName = (name: string): boolean => {
    if (!name) return true; // Empty is allowed (will use username)
    
    const lowerName = name.toLowerCase();
    
    if (RESERVED_USERNAMES.map(r => r.toLowerCase()).includes(lowerName)) {
      setError('This display name is reserved');
      return false;
    }
    
    if (name.length < 2 || name.length > 20) {
      setError('Display name must be 2-20 characters');
      return false;
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      setError('Only letters, numbers, underscores, and hyphens allowed');
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!token || !profile) return;
    
    setError('');
    
    // Check if user can customize
    const roleConfig = ROLES[profile.role];
    if (!roleConfig.canCustomizeProfile) {
      setError('Your role does not allow profile customization');
      return;
    }
    
    // Validate display name
    if (!validateDisplayName(displayName)) {
      return;
    }
    
    // Validate bio length
    if (bio.length > roleConfig.maxBioLength) {
      setError(`Bio exceeds maximum length of ${roleConfig.maxBioLength} characters`);
      return;
    }

    // Validate links
    if (links.length > roleConfig.maxLinks) {
      setError(`Maximum ${roleConfig.maxLinks} links allowed for your role`);
      return;
    }

    setSaving(true);
    try {
      // Filter out empty links
      const validLinks = links.filter(link => link.trim() !== '');
      
      // In production, this would be an API call
      // await profileApi.update(token, { displayName: displayName || null, bio, links: validLinks });
      
      // Mock success
      setProfile({
        ...profile,
        displayName: displayName || null,
        bio,
        links: validLinks,
      });
      
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to save profile');
    }
    setSaving(false);
  };

  const formatDate = (timestamp: number | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Failed to load profile</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const roleConfig = ROLES[profile.role];
  const RoleIcon = roleConfig.icon;
  const canCustomize = roleConfig.canCustomizeProfile;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <User className="w-5 h-5 text-primary flex-shrink-0 self-center" />
          <span>My Profile</span>
        </h1>
        <p className="text-sm text-muted-foreground">Manage your profile and customization</p>
      </div>

      {/* Role Badge */}
      <Card className="mb-4 bg-card border-border card-realistic">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`w-12 h-12 rounded-full ${roleConfig.color.split(' ')[0]} flex items-center justify-center flex-shrink-0`}>
              <RoleIcon className={`w-6 h-6 ${roleConfig.color.split(' ')[1]}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h2 className="text-lg font-bold text-foreground">
                  @{profile.username}
                </h2>
                <Badge variant="outline" className={`${roleConfig.color} border flex items-center gap-1 text-xs`}>
                  <RoleIcon className="w-3 h-3 flex-shrink-0" />
                  <span>{roleConfig.label}</span>
                </Badge>
              </div>
              {profile.displayName && (
                <p className="text-sm text-muted-foreground">
                  Display name: <span className="text-foreground font-medium">{profile.displayName}</span>
                </p>
              )}
              <p className="text-[11px] text-muted-foreground mt-1">
                Joined {formatDate(profile.joinedAt)}
              </p>
            </div>
            {canCustomize && (
              <Button
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
                className="shrink-0 h-9 items-center text-sm"
              >
                {isEditing ? (
                  <>
                    <Lock className="w-4 h-4 mr-2 flex-shrink-0 self-center" />
                    <span className="self-center">Cancel</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4 mr-2 flex-shrink-0 self-center" />
                    <span className="self-center">Edit</span>
                  </>
                )}
              </Button>
            )}
          </div>
          
          {/* Role perks info */}
          <div className="mt-3 p-2.5 bg-primary/10 border border-primary/30 rounded-lg">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">{roleConfig.label} Perks</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              You can add a bio and links to your profile!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      {isEditing && canCustomize && (
        <Card className="mb-6 bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-primary" />
              Edit Profile
            </CardTitle>
            <CardDescription>
              Customize how others see you on the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Display Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <AtSign className="w-4 h-4 text-muted-foreground" />
                Display Name
              </label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Leave empty to use username"
                className="bg-input"
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground">
                2-20 characters. Letters, numbers, underscores, hyphens only. Cannot be: admin, owner, moderator, etc.
              </p>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                Bio
              </label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                className="bg-input min-h-[100px] resize-none"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                {bio.length}/200 characters
              </p>
            </div>

            {/* Links */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                Links (Max {roleConfig.maxLinks})
              </label>
              {links.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={link}
                    onChange={(e) => handleLinkChange(index, e.target.value)}
                    placeholder="https://..."
                    className="bg-input flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveLink(index)}
                    className="shrink-0 text-destructive hover:text-destructive"
                  >
                    Remove
                  </Button>
                </div>
              ))}
              {links.length < roleConfig.maxLinks && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddLink}
                  className="w-full"
                >
                  + Add Link
                </Button>
              )}
            </div>

            {/* Save Button */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Preview */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            Public Profile
          </CardTitle>
          <CardDescription>
            This is how other users see you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Bio Section */}
          {profile.bio ? (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">About</h4>
              <p className="text-sm text-muted-foreground bg-secondary/50 rounded-lg p-3">
                {profile.bio}
              </p>
            </div>
          ) : (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">About</h4>
              <p className="text-sm text-muted-foreground italic">
                {canCustomize ? 'No bio added yet. Edit your profile to add one!' : 'No bio available.'}
              </p>
            </div>
          )}

          {/* Links Section */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Links</h4>
            {profile.links.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.links.map((link, index) => (
                  <a
                    key={index}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary rounded-lg text-sm text-foreground hover:bg-secondary/80 transition-colors"
                  >
                    <LinkIcon className="w-3 h-3" />
                    {link.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]}
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {canCustomize ? 'No links added yet.' : 'No links available.'}
              </p>
            )}
          </div>

          {/* License Info */}
          <div className="pt-4 border-t border-border">
            <h4 className="text-sm font-medium text-foreground mb-2">License Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-secondary/50 rounded-lg p-3">
                <span className="text-xs text-muted-foreground">License Key</span>
                <p className="font-mono text-sm text-foreground">
                  {profile.key ? `${profile.key.substring(0, 8)}...` : 'No key'}
                </p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3">
                <span className="text-xs text-muted-foreground">Expires</span>
                <p className="text-sm text-foreground">
                  {profile.keyExpiry ? formatDate(profile.keyExpiry) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
