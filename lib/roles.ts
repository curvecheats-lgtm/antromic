import { 
  Shield, 
  Rocket, 
  Video, 
  Award, 
  User,
  MessageSquare,
  Share2,
  Star,
  Zap,
  Crown,
  Gem,
  Trophy,
  Heart,
  Flame,
  Sparkles,
  Target,
  Code,
  Palette,
  Music,
  Gift,
  Bug,
  ShieldCheck,
  Swords,
  Skull,
  Ghost,
  Cpu,
  Database,
  Globe,
  Lock,
  Key,
  Infinity
} from 'lucide-react';

export type RoleKey = 'owner' | 'admin' | 'moderator' | 'booster' | 'media' | 'og' | 'vip' | 'elite' | 'contributor' | 'supporter' | 'developer' | 'user';

// Badge types that users can unlock
export type BadgeKey = 'chatter' | 'sharer' | 'og' | 'booster' | 'media' | 'vip' | 'elite' | 'contributor' | 'helper' | 'bughunter' | 'coder' | 'artist' | 'musician' | 'gamer' | 'earlybird' | 'loyal' | 'legend' | 'mythic' | 'diamond' | 'platinum' | 'gold' | 'silver';

export interface BadgeConfig {
  icon: typeof MessageSquare;
  label: string;
  description: string;
  color: string;
  bgColor: string;
}

export interface RoleConfig {
  icon: typeof Shield;
  color: string;
  label: string;
  permissions: string[];
  canCustomizeProfile: boolean;
  canChangeDisplayName: boolean;
  canChangeUsernameColor: boolean;
  canAddEmbeds: boolean;
  maxBioLength: number;
  maxLinks: number;
  maxEmbeds: number;
  canUnlockBadges: boolean;
}

export const ROLES: Record<RoleKey, RoleConfig> = {
  owner: {
    icon: Shield,
    color: 'bg-red-500/20 text-red-500 border-red-500/30',
    label: 'Owner',
    permissions: ['*'],
    canCustomizeProfile: true,
    canChangeDisplayName: true,
    canChangeUsernameColor: true,
    canAddEmbeds: true,
    maxBioLength: 500,
    maxLinks: 5,
    maxEmbeds: 3,
    canUnlockBadges: true,
  },
  admin: {
    icon: Shield,
    color: 'bg-red-500/20 text-red-500 border-red-500/30',
    label: 'Admin',
    permissions: ['users', 'keys', 'configs', 'news', 'tickets', 'loaders'],
    canCustomizeProfile: true,
    canChangeDisplayName: true,
    canChangeUsernameColor: true,
    canAddEmbeds: true,
    maxBioLength: 500,
    maxLinks: 5,
    maxEmbeds: 3,
    canUnlockBadges: true,
  },
  moderator: {
    icon: ShieldCheck,
    color: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
    label: 'Moderator',
    permissions: ['chat', 'configs', 'tickets'],
    canCustomizeProfile: true,
    canChangeDisplayName: true,
    canChangeUsernameColor: true,
    canAddEmbeds: true,
    maxBioLength: 400,
    maxLinks: 4,
    maxEmbeds: 2,
    canUnlockBadges: true,
  },
  booster: {
    icon: Rocket,
    color: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
    label: 'Booster',
    permissions: ['chat', 'configs', 'tickets'],
    canCustomizeProfile: true,
    canChangeDisplayName: true,
    canChangeUsernameColor: true,
    canAddEmbeds: true,
    maxBioLength: 300,
    maxLinks: 4,
    maxEmbeds: 2,
    canUnlockBadges: true,
  },
  media: {
    icon: Video,
    color: 'bg-pink-500/20 text-pink-500 border-pink-500/30',
    label: 'Media',
    permissions: ['chat', 'configs', 'tickets'],
    canCustomizeProfile: true,
    canChangeDisplayName: true,
    canChangeUsernameColor: true,
    canAddEmbeds: true,
    maxBioLength: 300,
    maxLinks: 4,
    maxEmbeds: 2,
    canUnlockBadges: true,
  },
  og: {
    icon: Award,
    color: 'bg-green-500/20 text-green-500 border-green-500/30',
    label: 'OG',
    permissions: ['chat', 'configs', 'tickets'],
    canCustomizeProfile: true,
    canChangeDisplayName: true,
    canChangeUsernameColor: false,
    canAddEmbeds: true,
    maxBioLength: 300,
    maxLinks: 3,
    maxEmbeds: 1,
    canUnlockBadges: true,
  },
  vip: {
    icon: Crown,
    color: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
    label: 'VIP',
    permissions: ['chat', 'configs'],
    canCustomizeProfile: true,
    canChangeDisplayName: true,
    canChangeUsernameColor: true,
    canAddEmbeds: true,
    maxBioLength: 350,
    maxLinks: 4,
    maxEmbeds: 2,
    canUnlockBadges: true,
  },
  elite: {
    icon: Gem,
    color: 'bg-cyan-500/20 text-cyan-500 border-cyan-500/30',
    label: 'Elite',
    permissions: ['chat', 'configs', 'tickets'],
    canCustomizeProfile: true,
    canChangeDisplayName: true,
    canChangeUsernameColor: true,
    canAddEmbeds: true,
    maxBioLength: 400,
    maxLinks: 5,
    maxEmbeds: 3,
    canUnlockBadges: true,
  },
  contributor: {
    icon: Code,
    color: 'bg-teal-500/20 text-teal-500 border-teal-500/30',
    label: 'Contributor',
    permissions: ['chat', 'configs'],
    canCustomizeProfile: true,
    canChangeDisplayName: true,
    canChangeUsernameColor: true,
    canAddEmbeds: true,
    maxBioLength: 350,
    maxLinks: 4,
    maxEmbeds: 2,
    canUnlockBadges: true,
  },
  supporter: {
    icon: Heart,
    color: 'bg-rose-500/20 text-rose-500 border-rose-500/30',
    label: 'Supporter',
    permissions: ['chat', 'configs'],
    canCustomizeProfile: true,
    canChangeDisplayName: true,
    canChangeUsernameColor: false,
    canAddEmbeds: false,
    maxBioLength: 250,
    maxLinks: 3,
    maxEmbeds: 1,
    canUnlockBadges: true,
  },
  developer: {
    icon: Cpu,
    color: 'bg-violet-500/20 text-violet-500 border-violet-500/30',
    label: 'Developer',
    permissions: ['chat', 'configs', 'loaders'],
    canCustomizeProfile: true,
    canChangeDisplayName: true,
    canChangeUsernameColor: true,
    canAddEmbeds: true,
    maxBioLength: 400,
    maxLinks: 5,
    maxEmbeds: 3,
    canUnlockBadges: true,
  },
  user: {
    icon: User,
    color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
    label: 'User',
    permissions: ['chat', 'configs'],
    canCustomizeProfile: true,
    canChangeDisplayName: true,
    canChangeUsernameColor: false,
    canAddEmbeds: false,
    maxBioLength: 200,
    maxLinks: 2,
    maxEmbeds: 0,
    canUnlockBadges: false,
  },
};

// Reserved usernames that cannot be used as display names
export const RESERVED_USERNAMES = [
  'admin',
  'owner',
  'koni',
  'weird',
  'weirdposer',
  'moderator',
  'mod',
  'staff',
  'support',
  'help',
  'official',
  'antromic',
  'antromiccc',
  'system',
  'bot',
];

// Badge configurations - users unlock these based on activity
export const BADGES: Record<BadgeKey, BadgeConfig> = {
  chatter: {
    icon: MessageSquare,
    label: 'Chatter',
    description: 'Sent 100+ messages in global chat',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
  },
  sharer: {
    icon: Share2,
    label: 'Sharer',
    description: 'Shared 5+ configs with the community',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
  },
  og: {
    icon: Star,
    label: 'OG',
    description: 'Early supporter of Antromic',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
  },
  booster: {
    icon: Rocket,
    label: 'Booster',
    description: 'Server booster',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
  },
  media: {
    icon: Video,
    label: 'Content Creator',
    description: 'Verified content creator',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/20',
  },
  vip: {
    icon: Crown,
    label: 'VIP',
    description: 'Special recognition',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
  },
  elite: {
    icon: Trophy,
    label: 'Elite',
    description: 'Top contributor',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
  },
  contributor: {
    icon: Code,
    label: 'Contributor',
    description: 'Contributed to the project',
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/20',
  },
  helper: {
    icon: Heart,
    label: 'Helper',
    description: 'Helped 50+ users',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/20',
  },
  bughunter: {
    icon: Bug,
    label: 'Bug Hunter',
    description: 'Found and reported 5+ bugs',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
  },
  coder: {
    icon: Cpu,
    label: 'Coder',
    description: 'Submitted 10+ code contributions',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/20',
  },
  artist: {
    icon: Palette,
    label: 'Artist',
    description: 'Created custom artwork',
    color: 'text-fuchsia-400',
    bgColor: 'bg-fuchsia-500/20',
  },
  musician: {
    icon: Music,
    label: 'Musician',
    description: 'Created custom music/sounds',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/20',
  },
  gamer: {
    icon: Target,
    label: 'Gamer',
    description: 'Top player in community games',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
  },
  earlybird: {
    icon: Sparkles,
    label: 'Early Bird',
    description: 'Joined in the first week',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
  },
  loyal: {
    icon: Infinity,
    label: 'Loyal',
    description: 'Member for 1+ year',
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/20',
  },
  legend: {
    icon: Flame,
    label: 'Legend',
    description: 'Legendary community member',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/20',
  },
  mythic: {
    icon: Skull,
    label: 'Mythic',
    description: 'Mythic status achievement',
    color: 'text-zinc-300',
    bgColor: 'bg-zinc-500/20',
  },
  diamond: {
    icon: Gem,
    label: 'Diamond',
    description: 'Diamond tier achievement',
    color: 'text-slate-300',
    bgColor: 'bg-slate-500/20',
  },
  platinum: {
    icon: ShieldCheck,
    label: 'Platinum',
    description: 'Platinum tier achievement',
    color: 'text-gray-300',
    bgColor: 'bg-gray-500/20',
  },
  gold: {
    icon: Award,
    label: 'Gold',
    description: 'Gold tier achievement',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/20',
  },
  silver: {
    icon: Swords,
    label: 'Silver',
    description: 'Silver tier achievement',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
  },
};

// Username colors available for customization (booster/media only)
export const USERNAME_COLORS = [
  { name: 'Default', value: 'text-foreground', bg: 'bg-foreground' },
  { name: 'Red', value: 'text-red-400', bg: 'bg-red-500' },
  { name: 'Blue', value: 'text-blue-400', bg: 'bg-blue-500' },
  { name: 'Green', value: 'text-green-400', bg: 'bg-green-500' },
  { name: 'Purple', value: 'text-purple-400', bg: 'bg-purple-500' },
  { name: 'Pink', value: 'text-pink-400', bg: 'bg-pink-500' },
  { name: 'Yellow', value: 'text-yellow-400', bg: 'bg-yellow-500' },
  { name: 'Cyan', value: 'text-cyan-400', bg: 'bg-cyan-500' },
  { name: 'Orange', value: 'text-orange-400', bg: 'bg-orange-500' },
  { name: 'Lime', value: 'text-lime-400', bg: 'bg-lime-500' },
  { name: 'Emerald', value: 'text-emerald-400', bg: 'bg-emerald-500' },
  { name: 'Indigo', value: 'text-indigo-400', bg: 'bg-indigo-500' },
];

// Activity tracking thresholds for unlocking badges
export const BADGE_THRESHOLDS = {
  chatter: { messages: 100 },
  sharer: { configs: 5 },
};

export function isValidDisplayName(name: string): { valid: boolean; error?: string } {
  if (!name) {
    return { valid: true };
  }
  
  const lowerName = name.toLowerCase();
  
  if (RESERVED_USERNAMES.includes(lowerName)) {
    return { valid: false, error: 'This display name is reserved' };
  }
  
  if (name.length < 2 || name.length > 20) {
    return { valid: false, error: 'Display name must be 2-20 characters' };
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    return { valid: false, error: 'Only letters, numbers, underscores, and hyphens allowed' };
  }
  
  return { valid: true };
}

// Check if user has earned a badge based on activity
export function checkBadgeEligibility(
  badge: BadgeKey,
  stats: { messages?: number; configs?: number; isBooster?: boolean; isMedia?: boolean; isOG?: boolean }
): boolean {
  switch (badge) {
    case 'chatter':
      return (stats.messages || 0) >= BADGE_THRESHOLDS.chatter.messages;
    case 'sharer':
      return (stats.configs || 0) >= BADGE_THRESHOLDS.sharer.configs;
    case 'booster':
      return stats.isBooster || false;
    case 'media':
      return stats.isMedia || false;
    case 'og':
      return stats.isOG || false;
    default:
      return false;
  }
}
