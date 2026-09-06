import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  acknowledgeIncident,
  createIncident,
  investigateIncident,
  listIncidents,
  resolveIncident,
} from '../api/incidents';
import { getService } from '../api/services';
import { IncidentSeverity, IncidentSeverityLabel, IncidentStatus, IncidentStatusLabel } from '../api/types';
import type { IncidentSummaryDto, ServiceSummaryDto } from '../api/types';
import { useAuth } from '../context/AuthContext';

export function IncidentsPage() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const { user } = useAuth();
  const [service, setService] = useState<ServiceSummaryDto | null>(null);
  const [incidents, setIncidents] = useState<IncidentSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState<IncidentSeverity>(IncidentSeverity.P3_Medium);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolution, setResolution] = useState('');

  function refresh() {
    if (!serviceId) return;
    setLoading(true);
    listIncidents(serviceId)
      .then((page) => setIncidents(page.items))
      .catch(() => setError('Failed to load incidents.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!serviceId) return;
    getService(serviceId).then(setService).catch(() => setService(null));
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!serviceId) return;
    setError(null);
    try {
      await createIncident(serviceId, title, Number(severity) as IncidentSeverity);
      setTitle('');
      refresh();
    } catch {
      setError('Failed to create incident.');
    }
  }

  async function handleAcknowledge(id: string) {
    if (!user) return;
    try {
      await acknowledgeIncident(id, user.userId);
      refresh();
    } catch {
      setError('Failed to acknowledge incident.');
    }
  }

  async function handleInvestigate(id: string) {
    try {
      await investigateIncident(id);
      refresh();
    } catch {
      setError('Failed to update incident.');
    }
  }

  function startResolve(id: string) {
    setError(null);
    setResolvingId(id);
    setResolution('');
  }

  function cancelResolve() {
    setResolvingId(null);
    setResolution('');
  }

  async function submitResolve(id: string) {
    setError(null);
    try {
      await resolveIncident(id, resolution.trim());
      cancelResolve();
      refresh();
    } catch {
      setError('Failed to resolve incident.');
    }
  }

  return (
    <div>
      <p>
        <Link to="/services">&larr; Services</Link>
      </p>
      <h2>Incidents{service ? ` — ${service.name}` : ''}</h2>
      {error && <p className="error-text">{error}</p>}

      <form className="inline-form" onSubmit={handleCreate}>
        <input placeholder="Incident title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <select value={severity} onChange={(e) => setSeverity(Number(e.target.value) as IncidentSeverity)}>
          {Object.entries(IncidentSeverityLabel).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button type="submit">Report incident</button>
      </form>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((incident) => (
              <tr key={incident.id}>
                <td>
                  <Link to={`/incidents/${incident.id}`}>{incident.title}</Link>
                </td>
                <td>{IncidentSeverityLabel[incident.severity]}</td>
                <td>{IncidentStatusLabel[incident.status]}</td>
                <td>{new Date(incident.createdAt).toLocaleString()}</td>
                <td className="actions">
                  {resolvingId === incident.id ? (
                    <>
                      <input
                        autoFocus
                        placeholder="Resolution notes"
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && resolution.trim()) submitResolve(incident.id);
                          if (e.key === 'Escape') cancelResolve();
                        }}
                      />
                      <button disabled={!resolution.trim()} onClick={() => submitResolve(incident.id)}>
                        Save
                      </button>
                      <button onClick={cancelResolve}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button
                        disabled={incident.status !== IncidentStatus.Triggered}
                        onClick={() => handleAcknowledge(incident.id)}
                      >
                        Acknowledge
                      </button>
                      <button
                        disabled={incident.status !== IncidentStatus.Acknowledged}
                        onClick={() => handleInvestigate(incident.id)}
                      >
                        Investigate
                      </button>
                      <button
                        disabled={
                          incident.status !== IncidentStatus.Acknowledged &&
                          incident.status !== IncidentStatus.Investigating
                        }
                        onClick={() => startResolve(incident.id)}
                      >
                        Resolve
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {incidents.length === 0 && (
              <tr>
                <td colSpan={5}>No incidents yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
