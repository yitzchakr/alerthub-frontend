import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { createEscalationPolicy, deleteEscalationPolicy, listEscalationPolicies } from '../api/escalationPolicies';
import type { EscalationPolicySummaryDto } from '../api/types';
import { EscalationPolicyDetail } from '../components/EscalationPolicyDetail';

export function EscalationPoliciesPage() {
  const [policies, setPolicies] = useState<EscalationPolicySummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  function refresh() {
    setLoading(true);
    listEscalationPolicies()
      .then(setPolicies)
      .catch(() => setError('Failed to load escalation policies.'))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createEscalationPolicy(name);
      setName('');
      refresh();
    } catch {
      setError('Failed to create escalation policy.');
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await deleteEscalationPolicy(id);
      if (selectedId === id) setSelectedId(null);
      setConfirmingDeleteId(null);
      refresh();
    } catch {
      setError('Failed to delete escalation policy.');
    }
  }

  return (
    <div>
      <h2>Escalation Policies</h2>
      {error && <p className="error-text">{error}</p>}

      <form className="inline-form" onSubmit={handleCreate}>
        <input placeholder="Policy name" value={name} onChange={(e) => setName(e.target.value)} required />
        <button type="submit">Add policy</button>
      </form>

      <div className="split-panel">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <ul className="card-list">
            {policies.map((p) => (
              <li key={p.id} className={`card ${selectedId === p.id ? 'card-selected' : ''}`}>
                <button className="link-button" onClick={() => setSelectedId(p.id)}>
                  <strong>{p.name}</strong>
                </button>
                <p>{p.tierCount} tier(s)</p>
                {confirmingDeleteId === p.id ? (
                  <>
                    <button onClick={() => handleDelete(p.id)}>Confirm delete</button>
                    <button onClick={() => setConfirmingDeleteId(null)}>Cancel</button>
                  </>
                ) : (
                  <button onClick={() => setConfirmingDeleteId(p.id)}>Delete</button>
                )}
              </li>
            ))}
            {policies.length === 0 && <p>No escalation policies yet.</p>}
          </ul>
        )}

        {selectedId && <EscalationPolicyDetail policyId={selectedId} onChanged={refresh} />}
      </div>
    </div>
  );
}
