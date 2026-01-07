import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'admin' | 'staff' | 'super_admin';

interface TenantSubscription {
  subscriptionStatus: string | null;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  tenantId: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  subscription: TenantSubscription | null;
  isTrialExpired: boolean;
  hasValidSubscription: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<TenantSubscription | null>(null);

  const isTrialExpired = subscription?.subscriptionStatus === 'trial' && 
    subscription?.trialEndsAt && new Date(subscription.trialEndsAt) < new Date();
  
  const hasValidSubscription = 
    (subscription?.subscriptionStatus === 'trial' && subscription?.trialEndsAt && new Date(subscription.trialEndsAt) > new Date()) ||
    (subscription?.subscriptionStatus === 'active' && (!subscription?.subscriptionEndsAt || new Date(subscription.subscriptionEndsAt) > new Date()));

  useEffect(() => {
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setRole(null);
          setTenantId(null);
          setSubscription(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => authSubscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch role using maybeSingle to avoid errors when no data exists
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (!roleError && roleData) {
        setRole(roleData.role as UserRole);
      } else {
        // Default to 'staff' if no role found
        setRole('staff');
      }

      // Fetch tenant_id from profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', userId)
        .maybeSingle();
      
      if (!profileError && profileData && profileData.tenant_id) {
        setTenantId(profileData.tenant_id);
        
        // Fetch tenant subscription status
        const { data: tenantData } = await supabase
          .from('tenants')
          .select('subscription_status, trial_ends_at, subscription_ends_at')
          .eq('id', profileData.tenant_id)
          .maybeSingle();
        
        if (tenantData) {
          setSubscription({
            subscriptionStatus: tenantData.subscription_status,
            trialEndsAt: tenantData.trial_ends_at,
            subscriptionEndsAt: tenantData.subscription_ends_at,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setTenantId(null);
    setSubscription(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        tenantId,
        loading,
        signIn,
        signUp,
        signOut,
        isAdmin: role === 'admin' || role === 'super_admin',
        isSuperAdmin: role === 'super_admin',
        subscription,
        isTrialExpired: isTrialExpired || false,
        hasValidSubscription: hasValidSubscription || false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}