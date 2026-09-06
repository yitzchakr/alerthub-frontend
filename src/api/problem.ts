import { AxiosError } from 'axios';

/** RFC 9457 problem details, as the API's exception middleware writes them. */
interface ProblemDetails {
  title?: string;
  detail?: string;
  status?: number;
  traceId?: string;
  errors?: Record<string, string[]>;
}

/**
 * Turns a failed request into something worth showing a person.
 *
 * The API distinguishes deliberately: 404 and 409 and 400 carry a message an author wrote
 * for the caller, while a 500 carries only a trace id — arbitrary exception text could leak
 * schema or credentials, so it is logged server-side instead. Quoting the trace id back is
 * what makes that recoverable.
 */
export function describeError(error: unknown, fallback: string): string {
  if (!(error instanceof AxiosError) || !error.response) {
    return error instanceof AxiosError ? 'Could not reach the server.' : fallback;
  }

  const problem = error.response.data as ProblemDetails | undefined;

  if (problem?.errors) {
    const messages = Object.values(problem.errors).flat();
    if (messages.length > 0) return messages.join(' ');
  }

  if (problem?.detail) return problem.detail;

  if (error.response.status >= 500) {
    return problem?.traceId
      ? `${fallback} The server logged this as ${problem.traceId}.`
      : fallback;
  }

  return problem?.title ?? fallback;
}

/** True when the request lost a race or collided with existing state. */
export function isConflict(error: unknown): boolean {
  return error instanceof AxiosError && error.response?.status === 409;
}
