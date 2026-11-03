import { useState } from 'react';

// Polite status for what react-select does not announce: apply, reset and
// discarded changes. A trailing no-break space alternates so that the same
// message twice in a row is still announced.
export function useAnnouncer() {
  const [status, setStatus] = useState('');

  function announce(message: string) {
    setStatus((prev) => (prev === message ? `${message}\u00a0` : message));
  }

  return { status, announce };
}
