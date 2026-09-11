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
  duration: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  doneTimestamp?: string | null;
  language: string;
  exportTimestamp?: string | null;
  filePath?: string | null;
  fileSize?: string | null;
  resolution?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Logo {
  id: number;
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
  pendingAssets: number;
  completedAssets: number;
  inProgressAssets: number;
}
