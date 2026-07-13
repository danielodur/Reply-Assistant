import type { ReactNode } from 'react';
import DesktopWindowDragRegion from '../components/DesktopWindowDragRegion';
import { useAuth } from './AuthProvider';
import AuthShell from './AuthShell';

type AuthGateProps = {
  children: ReactNode;
};

export default function AuthGate({ children }: AuthGateProps) {
  const { loading, session, isEmailVerified } = useAuth();

  if (loading) {
    return (
      <div className="relative flex h-full min-h-screen w-full items-center justify-center bg-gradient-to-b from-[#fffafb] to-[#f8f4f6]">
        <DesktopWindowDragRegion className="z-50 w-full" />
        <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-[#f0dbe3] border-t-[#d05e8a]" />
      </div>
    );
  }

  if (!session || !isEmailVerified) {
    return (
      <div className="relative h-full min-h-screen w-full">
        <DesktopWindowDragRegion className="z-50 w-full" />
        <AuthShell pendingVerification={Boolean(session && !isEmailVerified)} />
      </div>
    );
  }

  return <>{children}</>;
}
