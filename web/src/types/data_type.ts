// Tipe data JSON dari EcoCraft API. Harus sama dengan bentuk respons server.

export type MaterialKey = 'plastik' | 'kardus' | 'tekstil' | 'kaca' | 'logam' | 'organik';
export type Difficulty = 'Sangat mudah' | 'Mudah' | 'Sedang' | 'Sulit';
export type ActionStatus = 'pending' | 'verified' | 'rejected';
export type Role = 'member' | 'admin';

/** Bentuk respons sukses semua endpoint. */
export interface ApiResponse<T> {
  message: string;
  data: T;
}

/** Bentuk respons error semua endpoint. */
export interface ApiErrorBody {
  message: string;
  errors?: Record<string, string>;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  coins: number;
  xp: number;
  level: number;
  xpPerLevel: number;
  createdAt: string;
}

export interface UserStats {
  actions: number;
  verifiedActions: number;
  pendingActions: number;
  pendingCoins: number;
  totalWeightKg: number;
  totalCo2Kg: number;
}

export interface Me extends User {
  stats: UserStats;
}

export interface AuthPayload {
  token: string;
  user: User;
}

export interface TutorialStep {
  id: number;
  stepOrder: number;
  description: string;
  imageUrl: string | null;
}

export interface Tutorial {
  id: number;
  title: string;
  description: string | null;
  material: MaterialKey;
  difficulty: Difficulty;
  durationMinutes: number;
  co2SavedKg: number;
  xpReward: number;
  imageUrl: string | null;
  author: { id: number; name: string } | null;
  stepCount: number;
  createdAt: string;
  updatedAt: string;
  steps?: TutorialStep[];
}

export interface TutorialInput {
  title: string;
  description: string;
  material: MaterialKey;
  difficulty: Difficulty;
  durationMinutes: number;
  co2SavedKg: number;
  xpReward: number;
  imageUrl: string | null;
  steps: { description: string; imageUrl?: string | null }[];
}

export interface TutorialQuery {
  material?: MaterialKey;
  q?: string;
  maxDuration?: number;
}

export interface Action {
  id: number;
  title: string;
  material: MaterialKey;
  weightKg: number;
  co2Kg: number;
  coins: number;
  xp: number;
  imageUrl: string | null;
  status: ActionStatus;
  kudosCount: number;
  kudosNeeded: number;
  likedByMe: boolean;
  user: { id: number; name: string };
  tutorial: { id: number; title: string } | null;
  createdAt: string;
  verifiedAt: string | null;
}

export interface ActionInput {
  title: string;
  material: MaterialKey;
  weightKg: number;
  imageUrl: string;
  tutorialId?: number | null;
}

export interface ActionQuery {
  status?: ActionStatus;
  material?: MaterialKey;
  userId?: number;
  tutorialId?: number;
}

export interface DropPoint {
  id: number;
  name: string;
  type: string;
  address: string | null;
  latitude: number;
  longitude: number;
  materials: MaterialKey[];
  openingHours: string | null;
  mapsUrl: string;
}

export interface DropPointInput {
  name: string;
  type: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  materials: MaterialKey[];
  openingHours: string;
}

export interface Reward {
  id: number;
  name: string;
  partner: string | null;
  description: string | null;
  costCoins: number;
  stock: number;
}

export interface Redemption {
  id: number;
  reward: { id: number | null; name: string };
  costCoins: number;
  voucherCode: string;
  createdAt: string;
}

export interface RedeemResult {
  redemption: Redemption;
  balance: number;
}

export interface UploadResult {
  url: string;
  path: string;
  size: number;
  mimeType: string;
}

export interface Stats {
  members: number;
  tutorials: number;
  dropPoints: number;
  actions: { total: number; pending: number; verified: number; rejected: number };
  totalWeightKg: number;
  totalCo2Kg: number;
  redemptions: number;
}

export interface EndpointDoc {
  group: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  auth: 'publik' | 'opsional' | 'login' | 'admin';
  description: string;
  body?: string;
  query?: string;
}

export interface ApiIndex {
  baseUrl: string;
  responseFormat: { success: string; error: string };
  auth: string;
  endpoints: EndpointDoc[];
}
