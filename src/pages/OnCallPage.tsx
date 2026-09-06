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

/** A datetime-local input has no zone, and the API reads an offsetless instant as UTC. */
function toUtcIsoString(localInputValue: string): string {
  return `${localInputValue}:00Z`;
}

function defaultShiftStart(): string {
  const now = new Date();
  now.setUTCMinutes(0, 0, 0);
  return now.toISOString().slice(0, 16);
}

function addHours(isoMinutes: string, hours: number): string {
  const date = new Date(`${isoMinutes}:00Z`);
  date.setUTCHours(date.getUTCHours() + hours);
  return date.toISOString().slice(0, 16);
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
  const [startUtc, setStartUtc] = useState(defaultShiftStart);
  const [endUtc, setEndUtc] = useState(() => addHours(defaultShiftStart(), 24));

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
        startUtc: toUtcIsoString(startUtc),
        endUtc: toUtcIsoString(endUtc),
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
          From (UTC){' '}
          <input
            type="datetime-local"
            value={startUtc}
            onChange={(e) => setStartUtc(e.target.value)}
            required
          />
        </label>
        <label>
          To (UTC){' '}
          <input
            type="datetime-local"
            value={endUtc}
            onChange={(e) => setEndUtc(e.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={!serviceId || !userId}>
          Add shift
        </button>
      </form>
      <p className="muted">
        Times are UTC. The end is exclusive, so a shift ending at 08:00 hands over cleanly to
        one starting at 08:00 — they may touch, but may not overlap.
      </p>

      <h3>Roster</h3>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Who</th>
              <th>From (UTC)</th>
              <th>To (UTC)</th>
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
