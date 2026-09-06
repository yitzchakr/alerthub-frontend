import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getIncidentDetail } from '../api/incidents';
import { describeError } from '../api/problem';
import {
  EscalationTargetSourceLabel,
  IncidentEventTypeLabel,
  IncidentSeverityLabel,
  IncidentStatus,
  IncidentStatusLabel,
} from '../api/types';
import type { IncidentDetailDto, IncidentEscalationDto } from '../api/types';

/** Escalation lands while you are looking at the page, so the page keeps up on its own. */
const REFRESH_INTERVAL_MS = 10_000;

export function IncidentDetailPage() {
  const { incidentId } = useParams<{ incidentId: string }>();
  const [incident, setIncident] = useState<IncidentDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!incidentId) return;
    getIncidentDetail(incidentId)
      .then((detail) => {
        setIncident(detail);
        setError(null);
      })
      .catch((e) => setError(describeError(e, 'Failed to load this incident.')))
      .finally(() => setLoading(false));
  }, [incidentId]);

  // Escalation only moves while the incident is still Triggered, so polling is keyed on a
  // plain boolean. Depending on the incident object instead would tear down and rebuild the
  // timer on every fetch, since each response is a new object.
  const stillEscalating = incident?.status === IncidentStatus.Triggered;

  useEffect(refresh, [refresh]);

  useEffect(() => {
    if (!stillEscalating) return;

    const timer = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [refresh, stillEscalating]);

  if (loading) return <p>Loading...</p>;

  if (error && !incident) {
    return (
      <div>
        <p className="error-text">{error}</p>
        <Link to="/services">&larr; Services</Link>
      </div>
    );
  }

  if (!incident) return <p>Incident not found.</p>;

  return (
    <div>
      <p>
        <Link to={`/services/${incident.serviceId}/incidents`}>
          &larr; {incident.serviceName} incidents
        </Link>
      </p>

      <h2>{incident.title}</h2>
      {error && <p className="error-text">{error}</p>}

      <dl className="fact-grid">
        <div>
          <dt>Service</dt>
          <dd>{incident.serviceName}</dd>
        </div>
        <div>
          <dt>Severity</dt>
          <dd>{IncidentSeverityLabel[incident.severity]}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{IncidentStatusLabel[incident.status]}</dd>
        </div>
        <div>
          <dt>Raised</dt>
          <dd>{new Date(incident.createdAt).toLocaleString()}</dd>
        </div>
        <div>
          <dt>Policy</dt>
          <dd>{incident.escalationPolicyName ?? <span className="muted">none</span>}</dd>
        </div>
        <div>
          <dt>Acknowledged by</dt>
          <dd>{incident.acknowledgedByDisplayName ?? <span className="muted">nobody yet</span>}</dd>
        </div>
      </dl>

      {incident.escalationExhaustedAt && (
        <p className="banner-danger">
          Escalation ran out of tiers at{' '}
          {new Date(incident.escalationExhaustedAt).toLocaleString()} and nobody acknowledged
          this incident. No further pages will be sent.
        </p>
      )}

      <section>
        <h3>
          Escalation{' '}
          {stillEscalating && <span className="muted">— live, refreshing every 10s</span>}
        </h3>

        {incident.escalations.length === 0 ? (
          <p className="muted">
            {incident.escalationPolicyName
              ? 'No tier has fired yet.'
              : 'This service has no escalation policy, so nothing will be paged.'}
          </p>
        ) : (
          <ol className="tier-list">
            {incident.escalations.map((escalation) => (
              <TierRow key={escalation.level} escalation={escalation} />
            ))}
          </ol>
        )}
      </section>

      <section>
        <h3>Timeline</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Event</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {incident.events.map((event, index) => (
              <tr key={`${event.occurredAt}-${index}`}>
                <td>{new Date(event.occurredAt).toLocaleString()}</td>
                <td>{IncidentEventTypeLabel[event.eventType]}</td>
                <td>{event.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function TierRow({ escalation }: { escalation: IncidentEscalationDto }) {
  const unsent = escalation.notifiedAt === null;
  // A tier that fired but resolved to nobody is the coverage gap this whole feature exists
  // to surface, so it is called out rather than shown as an empty list.
  const reachedNobody = !unsent && escalation.targets.length === 0;

  return (
    <li className="tier">
      <div className="tier-head">
        <strong>Tier {escalation.level}</strong>
        {unsent ? (
          <span className="pill pill-warn">
            not sent yet · {escalation.attempts} attempt{escalation.attempts === 1 ? '' : 's'}
          </span>
        ) : (
          <span className="pill">{new Date(escalation.notifiedAt!).toLocaleString()}</span>
        )}
        <span className="muted">next tier after {escalation.escalateAfterMinutes} min</span>
      </div>

      {reachedNobody ? (
        <p className="banner-warn">
          This tier fired but reached nobody. It is configured, but resolved to no people —
          most often an on-call assignment with no shift covering that moment.
        </p>
      ) : (
        <ul className="recipient-list">
          {escalation.targets.map((target) => (
            <li key={target.userId}>
              {target.displayName} <span className="muted">&lt;{target.email}&gt;</span>{' '}
              <span className="pill pill-quiet">
                {EscalationTargetSourceLabel[target.source]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
