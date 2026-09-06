import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { describeError, isConflict } from '../api/problem';
import {
  createOnCallShift,
  deleteOnCallShift,
  getCurrentOnCall,
  listOnCallShifts,
} from '../api/onCall';
import { listServices } from '../api/services';
import { listUsers } from '../api/users';
import type { OnCallShiftDto, OnCallUserDto, ServiceSummaryDto, UserSummaryDto } from '../api/types';

/**
 * Everything on this page is in the viewer's own timezone. "Am I on call tonight?" is a
 * local question, and the roster already rendered local times through toLocaleString — the
 * inputs previously claimed UTC, so a shift typed as 09:00 came back reading 12:00.
 */
const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

/** IANA ids contain a region, which excludes bare values like "UTC" that the API rejects. */
const ianaTimeZone = browserTimeZone.includes('/') ? browserTimeZone : undefined;

/** A datetime-local input wants local wall-clock, which toISOString will not give. */
function toInputValue(date: Date): string {
  const localMs = date.getTime() - date.getTimezoneOffset() * 60_000;
  return new Date(localMs).toISOString().slice(0, 16);
}

/** The input has no offset, so the browser reads it as local — exactly what is wanted. */
function toUtcIsoString(localInputValue: string): string {
  return new Date(localInputValue).toISOString();
}

function defaultShiftStart(): string {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  return toInputValue(start);
}

function addHours(localInputValue: string, hours: number): string {
  const date = new Date(localInputValue);
  date.setHours(date.getHours() + hours);
  return toInputValue(date);
}

function asUtcLabel(localInputValue: string): string {
  const date = new Date(localInputValue);
  return Number.isNaN(date.getTime()) ? '—' : date.toISOString().slice(0, 16).replace('T', ' ');
}

export function OnCallPage() {
  const [services, setServices] = useState<ServiceSummaryDto[]>([]);
  const [users, setUsers] = useState<UserSummaryDto[]>([]);
  const [serviceId, setServiceId] = useState('');
  const [shifts, setShifts] = useState<OnCallShiftDto[]>([]);
  const [onCallNow, setOnCallNow] = useState<OnCallUserDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState('');
  const [startLocal, setStartLocal] = useState(defaultShiftStart);
  const [endLocal, setEndLocal] = useState(() => addHours(defaultShiftStart(), 24));

  useEffect(() => {
    listServices()
      .then((loaded) => {
        setServices(loaded);
        if (loaded.length > 0) setServiceId((current) => current || loaded[0].id);
      })
      .catch((e) => setError(describeError(e, 'Failed to load services.')));

    listUsers()
      .then((loaded) => {
        setUsers(loaded);
        if (loaded.length > 0) setUserId((current) => current || loaded[0].id);
      })
      .catch((e) => setError(describeError(e, 'Failed to load users.')));
  }, []);

  const refresh = useCallback(() => {
    if (!serviceId) return;
    setLoading(true);

    Promise.all([listOnCallShifts({ serviceId, pageSize: 100 }), getCurrentOnCall(serviceId)])
      .then(([page, current]) => {
        setShifts(page.items);
        setOnCallNow(current.onCall);
        setError(null);
      })
      .catch((e) => setError(describeError(e, 'Failed to load the roster.')))
      .finally(() => setLoading(false));
  }, [serviceId]);

  useEffect(refresh, [refresh]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      await createOnCallShift({
        serviceId,
        userId,
        startUtc: toUtcIsoString(startLocal),
        endUtc: toUtcIsoString(endLocal),
        timeZoneId: ianaTimeZone,
      });
      refresh();
    } catch (err) {
      // Overlap is the one rejection worth naming, because it is a rule rather than a fault:
      // exactly one person is accountable at a time, so shifts may touch but not overlap.
      setError(
        isConflict(err)
          ? describeError(err, 'That window overlaps an existing shift.')
          : describeError(err, 'Failed to create the shift.'),
      );
    }
  }

  async function handleDelete(shiftId: string) {
    setError(null);
    try {
      await deleteOnCallShift(shiftId);
      refresh();
    } catch (err) {
      setError(describeError(err, 'Failed to delete the shift.'));
    }
  }

  return (
    <div>
      <h2>On-call</h2>
      {error && <p className="error-text">{error}</p>}

      <div className="inline-form">
        <label>
          Service{' '}
          <select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {serviceId &&
        (onCallNow ? (
          <p className="banner-ok">
            <strong>{onCallNow.displayName}</strong> is on call now{' '}
            <span className="muted">
              &lt;{onCallNow.email}&gt; · until {new Date(onCallNow.shiftEndUtc).toLocaleString()}
            </span>
          </p>
        ) : (
          <p className="banner-warn">
            Nobody is on call for this service right now. Any escalation tier assigned to the
            on-call schedule will reach nobody until a shift covers this moment.
          </p>
        ))}

      <h3>Add a shift</h3>
      <form className="inline-form" onSubmit={handleCreate}>
        <select value={userId} onChange={(e) => setUserId(e.target.value)}>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.displayName}
            </option>
          ))}
        </select>
        <label>
          From{' '}
          <input
            type="datetime-local"
            value={startLocal}
            onChange={(e) => setStartLocal(e.target.value)}
            required
          />
        </label>
        <label>
          To{' '}
          <input
            type="datetime-local"
            value={endLocal}
            onChange={(e) => setEndLocal(e.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={!serviceId || !userId}>
          Add shift
        </button>
      </form>
      <p className="muted">
        Times are in your timezone ({browserTimeZone}) — {asUtcLabel(startLocal)} to{' '}
        {asUtcLabel(endLocal)} UTC. The end is exclusive, so a shift ending at 08:00 hands over
        cleanly to one starting at 08:00 — they may touch, but may not overlap.
      </p>

      <h3>Roster</h3>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Who</th>
              <th>From</th>
              <th>To</th>
              <th>Zone</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {shifts.map((shift) => (
              <tr key={shift.id}>
                <td>
                  {shift.userDisplayName} <span className="muted">&lt;{shift.userEmail}&gt;</span>
                </td>
                <td>{new Date(shift.startUtc).toLocaleString()}</td>
                <td>{new Date(shift.endUtc).toLocaleString()}</td>
                <td>{shift.timeZoneId ?? <span className="muted">—</span>}</td>
                <td className="actions">
                  <button onClick={() => handleDelete(shift.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {shifts.length === 0 && (
              <tr>
                <td colSpan={5}>No shifts for this service.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
