import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { addAssignment, addTier, getEscalationPolicy } from '../api/escalationPolicies';
import type { EscalationPolicyDetailDto } from '../api/types';

export function EscalationPolicyDetail({ policyId, onChanged }: { policyId: string; onChanged: () => void }) {
  const [policy, setPolicy] = useState<EscalationPolicyDetailDto | null>(null);
  const [level, setLevel] = useState(1);
  const [escalateAfterMinutes, setEscalateAfterMinutes] = useState(15);
  const [error, setError] = useState<string | null>(null);
  const [assigningTierId, setAssigningTierId] = useState<string | null>(null);
  const [assigneeUserId, setAssigneeUserId] = useState('');

  function refresh() {
    getEscalationPolicy(policyId)
      .then(setPolicy)
      .catch(() => setError('Failed to load policy detail.'));
  }

  useEffect(refresh, [policyId]);

  async function handleAddTier(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await addTier(policyId, level, escalateAfterMinutes);
      refresh();
      onChanged();
    } catch {
      setError('Failed to add tier.');
    }
  }

  async function handleAddAssignment(tierId: string, userId?: string) {
    setError(null);
    try {
      await addAssignment(policyId, tierId, {
        userId: userId || undefined,
        useOnCallSchedule: !userId,
      });
      setAssigningTierId(null);
      setAssigneeUserId('');
      refresh();
    } catch {
      setError('Failed to add assignment.');
    }
  }

  if (!policy) return <div className="policy-detail">{error ?? 'Loading...'}</div>;

  return (
    <div className="policy-detail">
      <h3>{policy.name}</h3>
      {error && <p className="error-text">{error}</p>}

      <form className="inline-form" onSubmit={handleAddTier}>
        <input
          type="number"
          min={1}
          value={level}
          onChange={(e) => setLevel(Number(e.target.value))}
          title="Tier level"
        />
        <input
          type="number"
          min={1}
          value={escalateAfterMinutes}
          onChange={(e) => setEscalateAfterMinutes(Number(e.target.value))}
          title="Escalate after minutes"
        />
        <button type="submit">Add tier</button>
      </form>

      <ul className="card-list">
        {policy.tiers.map((tier) => (
          <li key={tier.id} className="card">
            <strong>Tier {tier.level}</strong> — escalates after {tier.escalateAfterMinutes}m
            <ul>
              {tier.assignments.map((a) => (
                <li key={a.id}>
                  {a.useOnCallSchedule ? 'On-call schedule' : `User ${a.userId ?? a.role ?? 'unassigned'}`}
                </li>
              ))}
            </ul>
            {assigningTierId === tier.id ? (
              <div className="inline-form">
                <input
                  autoFocus
                  placeholder="User ID (blank = on-call schedule)"
                  value={assigneeUserId}
                  onChange={(e) => setAssigneeUserId(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddAssignment(tier.id, assigneeUserId.trim());
                    if (e.key === 'Escape') setAssigningTierId(null);
                  }}
                />
                <button onClick={() => handleAddAssignment(tier.id, assigneeUserId.trim())}>Save</button>
                <button onClick={() => setAssigningTierId(null)}>Cancel</button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAssigningTierId(tier.id);
                  setAssigneeUserId('');
                }}
              >
                Add assignment
              </button>
            )}
          </li>
        ))}
        {policy.tiers.length === 0 && <p>No tiers yet.</p>}
      </ul>
    </div>
  );
}
