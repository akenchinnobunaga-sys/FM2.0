import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, FamilySpace, SpaceMembership } from '../types/database';
import { localDB, INITIAL_OWNER_EMAIL } from '../services/storage';
import { supabase, isSupabaseConfigured } from '../config/supabase';

interface AuthContextType {
  currentUser: UserProfile | null;
  currentSpace: FamilySpace | null;
  userSpaces: FamilySpace[];
  userMemberships: SpaceMembership[];
  isOwner: boolean;
  isSuspended: boolean;
  isLoading: boolean;
  authMode: 'supabase' | 'local';
  setCurrentSpace: (space: FamilySpace) => void;
  switchUserPersona: (userId: string) => void;
  signIn: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  signUpWithCode: (code: string, email: string, password?: string, fullName?: string) => Promise<{ success: boolean; message?: string }>;
  requestAccess: (fullName: string, email: string, phone?: string, reason?: string) => Promise<{ success: boolean; message?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentSpace, setCurrentSpace] = useState<FamilySpace | null>(null);
  const [userSpaces, setUserSpaces] = useState<FamilySpace[]>([]);
  const [userMemberships, setUserMemberships] = useState<SpaceMembership[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authMode, setAuthMode] = useState<'supabase' | 'local'>('local');

  const loadUserData = (user: UserProfile) => {
    setCurrentUser(user);

    // Si el usuario está suspendido, no cargar espacios
    if (user.status === 'suspended') {
      setUserSpaces([]);
      setCurrentSpace(null);
      setUserMemberships([]);
      return;
    }

    const state = localDB.getState();

    // Membresías del usuario
    const memberships = state.memberships.filter((m) => m.user_id === user.id);
    setUserMemberships(memberships);

    // Garantizar que cada usuario disponga de su propio espacio financiero personal
    const personalSpace = localDB.ensurePersonalSpace(user.id, user.display_name);

    // Espacios propios del usuario (aislamiento estricto por usuario)
    const ownSpaces = state.spaces.filter((s) => s.created_by === user.id);
    const validSpaces = ownSpaces.length > 0 ? ownSpaces : [personalSpace];

    setUserSpaces(validSpaces);
    setCurrentSpace(validSpaces[0]);
  };

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);

      if (isSupabaseConfigured() && supabase) {
        setAuthMode('supabase');
        try {
          const { data } = await supabase.auth.getSession();
          if (data?.session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.session.user.id)
              .single();

            if (profile) {
              loadUserData(profile);
              setIsLoading(false);
              return;
            }
          }
        } catch (e) {
          console.warn('Error connecting to live Supabase, switching to local DB:', e);
        }
      }

      // Modo Local: verificar si hay sesión activa previamente autenticada en este dispositivo
      setAuthMode('local');
      const state = localDB.getState();
      const savedUserId = localStorage.getItem('finanzas_active_persona_id');

      // IMPORTANTE: Ningún dispositivo nuevo entra automáticamente como administrador.
      // Solo si el usuario ha iniciado sesión previamente en este dispositivo se restaura la sesión.
      if (savedUserId) {
        const targetUser = state.profiles.find((p) => p.id === savedUserId);
        if (targetUser && targetUser.status !== 'suspended') {
          loadUserData(targetUser);
        } else {
          localStorage.removeItem('finanzas_active_persona_id');
          setCurrentUser(null);
          setCurrentSpace(null);
        }
      } else {
        // En una instalación nueva se exige autenticación
        setCurrentUser(null);
        setCurrentSpace(null);
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    const result = localDB.authenticate(email, password);
    if (!result.success || !result.user) {
      return { success: false, message: result.message || 'Credenciales inválidas' };
    }

    localStorage.setItem('finanzas_active_persona_id', result.user.id);
    loadUserData(result.user);
    return { success: true };
  };

  const signUpWithCode = async (
    code: string,
    email: string,
    password?: string,
    fullName?: string
  ): Promise<{ success: boolean; message?: string }> => {
    const res = localDB.redeemActivationCode(code, email, password, fullName);
    if (!res.success || !res.user) {
      return { success: false, message: res.message };
    }

    localStorage.setItem('finanzas_active_persona_id', res.user.id);
    loadUserData(res.user);
    return { success: true, message: res.message };
  };

  const requestAccess = async (
    fullName: string,
    email: string,
    phone?: string,
    reason?: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      localDB.createAccessRequest({ full_name: fullName, email, phone, reason });
      return {
        success: true,
        message: 'Solicitud enviada correctamente. El administrador revisará tu solicitud para emitir tus credenciales.',
      };
    } catch (e: any) {
      return { success: false, message: e.message || 'Error al enviar solicitud' };
    }
  };

  const switchUserPersona = (userId: string) => {
    const state = localDB.getState();
    const user = state.profiles.find((p) => p.id === userId);
    if (user) {
      localStorage.setItem('finanzas_active_persona_id', userId);
      loadUserData(user);
    }
  };

  const refreshProfile = () => {
    if (currentUser) {
      const state = localDB.getState();
      const updated = state.profiles.find((p) => p.id === currentUser.id);
      if (updated) {
        loadUserData(updated);
      }
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signOut();
    }
    // Elimina la sesión local persistente
    localStorage.removeItem('finanzas_active_persona_id');
    setCurrentUser(null);
    setCurrentSpace(null);
    setUserSpaces([]);
    setUserMemberships([]);
  };

  const isOwner = currentUser?.global_role === 'owner' || currentUser?.email === INITIAL_OWNER_EMAIL;
  const isSuspended = currentUser?.status === 'suspended';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentSpace,
        userSpaces,
        userMemberships,
        isOwner,
        isSuspended,
        isLoading,
        authMode,
        setCurrentSpace,
        switchUserPersona,
        signIn,
        signUpWithCode,
        requestAccess,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
