import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getAppProfile } from '../config/appProfile';
import { setAccessTokenGetter } from './authSessionBridge';
import { applyVerifiedAuthUserToProfile } from './authProfileBridge';
import { syncProfileToSupabase } from './profileSync';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

type AuthContextValue = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  isEmailVerified: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function isVerifiedUser(user: User | null): boolean {
  if (!user) return false;
  return Boolean(user.email_confirmed_at);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const applySession = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    if (nextSession?.user && isVerifiedUser(nextSession.user)) {
      applyVerifiedAuthUserToProfile(nextSession.user);
      const profile = getAppProfile();
      await syncProfileToSupabase(nextSession.user.id, profile);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }
    const { data } = await supabase.auth.getSession();
    await applySession(data.session ?? null);
    setLoading(false);
  }, [applySession]);

  useEffect(() => {
    setAccessTokenGetter(() => session?.access_token ?? null);
  }, [session]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    void refreshSession();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void applySession(nextSession);
      setLoading(false);
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, [applySession, refreshSession]);

  useEffect(() => {
    const unsubscribe = window.desktopApp?.onAuthCallback?.(payload => {
      const supabase = getSupabaseClient();
      if (!supabase) return;
      void supabase.auth.setSession({
        access_token: payload.access_token,
        refresh_token: payload.refresh_token,
      }).then(({ data, error }) => {
        if (error) {
          console.warn('[auth] deep link session failed', error.message);
          return;
        }
        void applySession(data.session ?? null);
      });
    });

    return () => {
      unsubscribe?.();
    };
  }, [applySession]);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    if (window.desktopApp?.isChildWindow) {
      await window.desktopApp.sendChildAction?.({ type: 'sign-out' });
      return;
    }

    await window.desktopApp?.closeChildScreen?.();

    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.warn('[auth] sign out failed', error.message);
    }
    await applySession(null);
    setLoading(false);
  }, [applySession]);

  const value = useMemo<AuthContextValue>(() => ({
    loading,
    session,
    user,
    isEmailVerified: isVerifiedUser(user),
    signOut,
    refreshSession,
  }), [loading, session, user, signOut, refreshSession]);

  if (!isSupabaseConfigured) {
    return (
      <div className="flex h-screen items-center justify-center bg-white px-6 text-center text-[13px] text-slate-600">
        Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to apps/web/.env.
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
