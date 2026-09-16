import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { describeError } from '../api/problem';
import { createUser, deactivateUser, listUsers, reactivateUser } from '../api/users';
import {
  EscalationRole,
  EscalationRoleLabel,
  PermissionRole,
  PermissionRoleLabel,
} from '../api/types';
import type { UserSummaryDto } from '../api/types';
import { useAuth } from '../context/AuthContext';

const permissionRoles = Object.values(PermissionRole);
const escalationRoles = Object.values(EscalationRole);

/** Mirrors the API validator, so the rule is visible before the request rather than after. */
const passwordRule = 'At least 8 characters, with an uppercase letter, a lowercase one and a digit.';

function formatDeparture(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function StaffPage() {
  const { user } = useAuth();

  const [staff, setStaff] = useState<UserSummaryDto[]>([]);
  const [showDeparted, setShowDeparted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [permissionRole, setPermissionRole] = useState<PermissionRole>(PermissionRole.Member);
  const [escalationRole, setEscalationRole] = useState<EscalationRole>(EscalationRole.Responder);
  const [creating, setCreating] = useState(false);

  const refresh = useCallback(() => {
    setLoading(true);
    // Always fetch everyone: the toggle is a view over one list, so flipping it does not
    // cost a round trip and cannot show a half-stale table.
    listUsers({ includeDeactivated: true })
      .then((loaded) => {
        setStaff(loaded);
        setError(null);
      })
      .catch((e) => setError(describeError(e, 'Failed to load staff.')))
      .finally(() => setLoading(false));
  }, []);

  useEffect(refresh, [refresh]);

  const active = staff.filter((s) => s.deactivatedAt === null);
  const visible = showDeparted ? staff : active;
  const departedCount = staff.length - active.length;

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      await createUser({ displayName, email, password, permissionRole, escalationRole });
      setDisplayName('');
      setEmail('');
      setPassword('');
      refresh();
    } catch (err) {
      setError(describeError(err, 'Failed to create the account.'));
    } finally {
      setCreating(false);
    }
  }

  async function handleActivation(target: UserSummaryDto) {
    setError(null);
    setBusyUserId(target.id);
    const departing = target.deactivatedAt === null;
    try {
      await (departing ? deactivateUser(target.id) : reactivateUser(target.id));
      refresh();
    } catch (err) {
      setError(
        describeError(
          err,
          departing
            ? `Failed to deactivate ${target.displayName}.`
            : `Failed to reactivate ${target.displayName}.`,
        ),
      );
    } finally {
      setBusyUserId(null);
    }
  }

  return (
    <div>
      <h2>Staff</h2>

      <p className="muted">
        Two separate things: what somebody may do in AlertHub, and who a policy pages when a
        tier targets a role. Changing one does not change the other.
      </p>

      {error && <p className="error-text">{error}</p>}

      <form className="staff-form" onSubmit={handleCreate}>
        <label>
          Full name
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        </label>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            title={passwordRule}
            required
          />
        </label>
        <label>
          Authorization
          <select
            value={permissionRole}
            onChange={(e) => setPermissionRole(Number(e.target.value) as PermissionRole)}
            title="What this person may do. Admin is the only value the API checks; Member is everyone else."
          >
            {permissionRoles.map((role) => (
              <option key={role} value={role}>
                {PermissionRoleLabel[role]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Paged as
          <select
            value={escalationRole}
            onChange={(e) => setEscalationRole(Number(e.target.value) as EscalationRole)}
            title="Which sweep pages this person when a tier targets a role. Grants nothing."
          >
            {escalationRoles.map((role) => (
              <option key={role} value={role}>
                {EscalationRoleLabel[role]}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={creating}>
          {creating ? 'Adding...' : 'Add person'}
        </button>
        <p className="muted hint">{passwordRule}</p>
      </form>

      {departedCount > 0 && (
        <label className="inline-form">
          <input
            type="checkbox"
            checked={showDeparted}
            onChange={(e) => setShowDeparted(e.target.checked)}
          />
          Show {departedCount} departed
        </label>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : error && staff.length === 0 ? (
        // Nothing loaded, so say nothing about coverage. Rendering "Admin: 0" here would
        // assert that a tier paging Admin reaches nobody, which is a different and much
        // more alarming claim than "we could not read the list".
        <p className="muted">The staff list could not be loaded, so it is not shown.</p>
      ) : (
        <>
        <PagedAsSummary active={active} />
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th title="What they may do in AlertHub.">Authorization</th>
              <th title="Who a tier reaches when it targets a role.">Paged as</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {visible.map((person) => {
              const departed = person.deactivatedAt !== null;
              const isSelf = person.id === user?.userId;

              return (
                <tr key={person.id} className={departed ? 'muted' : undefined}>
                  <td>
                    {person.displayName}
                    {isSelf && <span className="muted"> (you)</span>}
                    {departed && (
                      <span className="pill pill-warn" title={`Left ${formatDeparture(person.deactivatedAt!)}`}>
                        departed
                      </span>
                    )}
                  </td>
                  <td>{person.email}</td>
                  <td>
                    <span className="pill">{PermissionRoleLabel[person.permissionRole]}</span>
                  </td>
                  <td>
                    {departed ? (
                      <span className="muted">nobody — they have left</span>
                    ) : (
                      <span className="pill pill-quiet">
                        {EscalationRoleLabel[person.escalationRole]}
                      </span>
                    )}
                  </td>
                  <td className="actions">
                    {isSelf ? (
                      // The API refuses this with a 409 — it is how a tenant loses its last
                      // Admin — so there is no point offering the button.
                      <span className="muted" title="Another Admin has to do this.">
                        —
                      </span>
                    ) : (
                      <button
                        className="link-button"
                        disabled={busyUserId === person.id}
                        onClick={() => handleActivation(person)}
                      >
                        {departed ? 'Reactivate' : 'Deactivate'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {visible.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  Nobody here yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </>
      )}
    </div>
  );
}

/**
 * How many people each role sweep would actually reach.
 *
 * A tier targeting a role with nobody in it is configured, looks fine on the policy screen,
 * and pages no one — the failure this product exists to prevent. Counting them here is the
 * cheapest place to notice.
 */
function PagedAsSummary({ active }: { active: UserSummaryDto[] }) {
  return (
    <div className="coverage">
      <span className="muted">A tier paging a role would reach:</span>
      {escalationRoles.map((role) => {
        const count = active.filter((s) => s.escalationRole === role).length;
        return (
          <span
            key={role}
            className={count === 0 ? 'pill pill-warn' : 'pill pill-quiet'}
            title={
              count === 0
                ? `A tier paging ${EscalationRoleLabel[role]} would reach nobody.`
                : `${count} active ${count === 1 ? 'person' : 'people'} paged as ${EscalationRoleLabel[role]}.`
            }
          >
            {EscalationRoleLabel[role]}: {count}
          </span>
        );
      })}
    </div>
  );
}
