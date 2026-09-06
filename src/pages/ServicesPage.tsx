import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { createService, listServices } from '../api/services';
import type { ServiceSummaryDto } from '../api/types';

export function ServicesPage() {
  const [services, setServices] = useState<ServiceSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    setLoading(true);
    listServices()
      .then(setServices)
      .catch(() => setError('Failed to load services.'))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createService(name, description || undefined);
      setName('');
      setDescription('');
      refresh();
    } catch {
      setError('Failed to create service.');
    }
  }

  return (
    <div>
      <h2>Services</h2>
      {error && <p className="error-text">{error}</p>}

      <form className="inline-form" onSubmit={handleCreate}>
        <input placeholder="Service name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit">Add service</button>
      </form>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul className="card-list">
          {services.map((s) => (
            <li key={s.id} className="card">
              <Link to={`/services/${s.id}/incidents`}>
                <strong>{s.name}</strong>
              </Link>
              {s.description && <p>{s.description}</p>}
            </li>
          ))}
          {services.length === 0 && <p>No services yet.</p>}
        </ul>
      )}
    </div>
  );
}
