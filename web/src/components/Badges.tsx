import { BadgeCheck, Ban, Hourglass } from 'lucide-react';
import type { ActionStatus, MaterialKey } from '../types/data_type';
import { MATERIALS, STATUS_LABEL } from '../utils/format';

export function MaterialBadge({ material }: { material: MaterialKey }) {
  const m = MATERIALS[material];
  return <span className="badge" style={{ color: m.color, background: m.tint }}>{m.label}</span>;
}

export function StatusBadge({ status }: { status: ActionStatus }) {
  const Icon = status === 'verified' ? BadgeCheck : status === 'pending' ? Hourglass : Ban;
  return <span className={`status status-${status}`}><Icon size={14} />{STATUS_LABEL[status]}</span>;
}

export function MethodBadge({ method }: { method: string }) {
  return <span className={`method method-${method.toLowerCase()}`}>{method}</span>;
}
