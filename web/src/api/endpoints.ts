// Seluruh pemanggilan REST API EcoCraft dari Web Client, dikelompokkan per resource.
// Setiap fungsi mengembalikan isi field "data" dari respons { message, data }.
import axiosClient from './axiosClient';
import type {
  Action, ActionInput, ActionQuery, ActionStatus, ApiIndex, ApiResponse, AuthPayload, DropPoint, DropPointInput,
  Me, MaterialKey, RedeemResult, Redemption, Reward, Stats, Tutorial, TutorialInput, TutorialQuery, UploadResult,
} from '../types/data_type';

const data = <T>(p: Promise<{ data: ApiResponse<T> }>) => p.then((res) => res.data.data);

/* ---------- Umum ---------- */
export const metaApi = {
  /** GET /api */
  index: () => data<ApiIndex>(axiosClient.get('/api')),
  /** GET /api/stats */
  stats: () => data<Stats>(axiosClient.get('/api/stats')),
};

/* ---------- Autentikasi & profil ---------- */
export const authApi = {
  /** POST /api/auth/login */
  login: (email: string, password: string) => data<AuthPayload>(axiosClient.post('/api/auth/login', { email, password })),
  /** POST /api/auth/register */
  register: (name: string, email: string, password: string) => data<AuthPayload>(axiosClient.post('/api/auth/register', { name, email, password })),
  /** GET /api/me */
  me: () => data<Me>(axiosClient.get('/api/me')),
  /** GET /api/me/actions */
  myActions: () => data<Action[]>(axiosClient.get('/api/me/actions')),
  /** GET /api/me/redemptions */
  myRedemptions: () => data<Redemption[]>(axiosClient.get('/api/me/redemptions')),
};

/* ---------- Tutorial ---------- */
export const tutorialApi = {
  /** GET /api/tutorials?material=&q=&maxDuration= */
  list: (query: TutorialQuery = {}) => data<Tutorial[]>(axiosClient.get('/api/tutorials', { params: query })),
  /** GET /api/tutorials/:id */
  get: (id: number) => data<Tutorial>(axiosClient.get(`/api/tutorials/${id}`)),
  /** POST /api/tutorials (admin) */
  create: (body: TutorialInput) => data<Tutorial>(axiosClient.post('/api/tutorials', body)),
  /** PUT /api/tutorials/:id (admin) */
  update: (id: number, body: TutorialInput) => data<Tutorial>(axiosClient.put(`/api/tutorials/${id}`, body)),
  /** DELETE /api/tutorials/:id (admin) */
  remove: (id: number) => data<{ id: number }>(axiosClient.delete(`/api/tutorials/${id}`)),
};

/* ---------- Aksi & Eco-Kudos ---------- */
export const actionApi = {
  /** GET /api/actions?status=&material=&userId=&tutorialId= */
  list: (query: ActionQuery = {}) => data<Action[]>(axiosClient.get('/api/actions', { params: query })),
  /** GET /api/actions/:id */
  get: (id: number) => data<Action>(axiosClient.get(`/api/actions/${id}`)),
  /** POST /api/actions */
  create: (body: ActionInput) => data<Action>(axiosClient.post('/api/actions', body)),
  /** PATCH /api/actions/:id */
  update: (id: number, body: Partial<ActionInput>) => data<Action>(axiosClient.patch(`/api/actions/${id}`, body)),
  /** DELETE /api/actions/:id */
  remove: (id: number) => data<{ id: number }>(axiosClient.delete(`/api/actions/${id}`)),
  /** POST /api/actions/:id/kudos */
  giveKudos: (id: number) => axiosClient.post<ApiResponse<Action>>(`/api/actions/${id}/kudos`).then((r) => r.data),
  /** DELETE /api/actions/:id/kudos */
  removeKudos: (id: number) => data<Action>(axiosClient.delete(`/api/actions/${id}/kudos`)),
  /** PATCH /api/actions/:id/status (admin) */
  setStatus: (id: number, status: ActionStatus) => data<Action>(axiosClient.patch(`/api/actions/${id}/status`, { status })),
};

/* ---------- Unggah foto ---------- */
export const uploadApi = {
  /** POST /api/uploads (multipart/form-data, field "image") */
  image: (file: File) => {
    const form = new FormData();
    form.append('image', file);
    return data<UploadResult>(axiosClient.post('/api/uploads', form, { headers: { 'Content-Type': 'multipart/form-data' } }));
  },
};

/* ---------- Titik setor ---------- */
export const dropPointApi = {
  /** GET /api/drop-points?material= */
  list: (material?: MaterialKey) => data<DropPoint[]>(axiosClient.get('/api/drop-points', { params: { material } })),
  /** POST /api/drop-points (admin) */
  create: (body: DropPointInput) => data<DropPoint>(axiosClient.post('/api/drop-points', body)),
  /** PUT /api/drop-points/:id (admin) */
  update: (id: number, body: DropPointInput) => data<DropPoint>(axiosClient.put(`/api/drop-points/${id}`, body)),
  /** DELETE /api/drop-points/:id (admin) */
  remove: (id: number) => data<{ id: number }>(axiosClient.delete(`/api/drop-points/${id}`)),
};

/* ---------- Reward ---------- */
export const rewardApi = {
  /** GET /api/rewards */
  list: () => data<Reward[]>(axiosClient.get('/api/rewards')),
  /** POST /api/rewards/:id/redeem */
  redeem: (id: number) => data<RedeemResult>(axiosClient.post(`/api/rewards/${id}/redeem`)),
};
