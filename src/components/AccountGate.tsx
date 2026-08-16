import { ProtectedRoute } from '@/components/ProtectedRoute';

/**
 * Backwards-compatible alias for ProtectedRoute — wraps account-only screens
 * (farms, history). Guests see the create-account prompt.
 */
export function AccountGate({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
