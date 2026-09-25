export interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'VIEWER';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'VIEWER';
}

export interface Asset {
  id: string;
  title: string;
  logoType?: string | null;
  logoId?: string | null;
  duration: number;
  status: 'PENDING' | 'COMPLETED';
  doneTimestamp?: string | null;
  language?: string | null;
  exportTimestamp?: string | null;
  filePath?: string | null;
  fileSize?: string | null;
  resolution?: string | null;
  blitzAgId?: string | null;
  logoPresent?: string | null;
  whichLogo?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Logo {
  id: number;
  channelName?: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  uploadedBy: string;
  createdAt: string;
}

export interface ActivityLog {
  id: number;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface AssetStats {
  totalAssets: number;
  pendingAssets?: number;
  completedAssets: number;
  completedHours: number;
}
