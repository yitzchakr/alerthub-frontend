import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { addAssignment, addTier, getEscalationPolicy } from '../api/escalationPolicies';
import { listUsers } from '../api/users';
import { EscalationRoleLabel } from '../api/types';
import type {
  EscalationAssignmentDto,
  EscalationPolicyDetailDto,
  UserSummaryDto,
} from '../api/types';

/** A tier targets one of three things, and each reads differently to a person. */
function describeAssignment(assignment: EscalationAssignmentDto) {
  if (assignment.useOnCallSchedule) return 'Whoever is on call';
  if (assignment.escalationRole != null)
    return `Everyone paged as ${EscalationRoleLabel[assignment.escalationRole]}`;
  return assignment.userDisplayName ?? 'Unknown user';
}

export function EscalationPolicyDetail({ policyId, onChanged }: { policyId: string; onChanged: () => void }) {
  const [policy, setPolicy] = useState<EscalationPolicyDetailDto | null>(null);
  const [level, setLevel] = useState(1);
  const [escalateAfterMinutes, setEscalateAfterMinutes] = useState(15);
  const [error, setError] = useState<string | null>(null);
  const [assigningTierId, setAssigningTierId] = useState<string | null>(null);
  const [assigneeUserId, setAssigneeUserId] = useState('');
  const [users, setUsers] = useState<UserSummaryDto[]>([]);

  useEffect(() => {
    listUsers()
      .then(setUsers)
      .catch(() => setError('Failed to load users.'));
  }, []);

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
                  {describeAssignment(a)}
                  {a.userEmail && <span className="muted"> &lt;{a.userEmail}&gt;</span>}
                </li>
              ))}
              {tier.assignments.length === 0 && (
                <li className="muted">Nobody — this tier will reach no one.</li>
              )}
            </ul>
            {assigningTierId === tier.id ? (
              <div className="inline-form">
                <select
                  autoFocus
                  value={assigneeUserId}
                  onChange={(e) => setAssigneeUserId(e.target.value)}
                >
                  <option value="">Whoever is on call</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.displayName}
                    </option>
                  ))}
                </select>
                <button onClick={() => handleAddAssignment(tier.id, assigneeUserId)}>Save</button>
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
