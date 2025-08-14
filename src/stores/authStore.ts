import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

export type UserRole = 'reception' | 'consultant' | 'manager' | 'admin'

export interface AuthUser extends User {
  consultant_profile?: {
    id: string
    name: string
    role: UserRole
    active: boolean
    performance_metrics: any
  }
}

interface AuthStore {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  initialized: boolean
  
  // Actions
  signInWithCode: (code: string) => Promise<{ success: boolean; error: string | null }>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
  updateProfile: (data: Partial<AuthUser['consultant_profile']>) => Promise<void>
  
  // Getters
  isAuthenticated: () => boolean
  getUserRole: () => UserRole | null
  hasPermission: (requiredRole: UserRole | UserRole[]) => boolean
  isManager: () => boolean
  isConsultant: () => boolean
  isReception: () => boolean
}

const roleHierarchy: Record<UserRole, number> = {
  reception: 1,
  consultant: 2,
  manager: 3,
  admin: 4,
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      loading: false,
      initialized: false,

      signInWithCode: async (code: string) => {
        set({ loading: true })
        
        try {
          // Check if code is 'admin'
          if (code.toLowerCase() === 'admin') {
            const adminUser: AuthUser = {
              id: 'admin-user',
              email: 'admin@tahboubgroup.com',
              user_metadata: { name: 'Administrator' },
              app_metadata: {},
              aud: 'authenticated',
              created_at: new Date().toISOString(),
              consultant_profile: {
                id: 'admin-profile',
                name: 'System Administrator',
                role: 'admin' as UserRole,
                active: true,
                performance_metrics: {}
              }
            } as AuthUser

            set({ 
              user: adminUser, 
              session: { 
                access_token: 'admin-token',
                user: adminUser
              } as any,
              loading: false 
            })
            
            return { success: true, error: null }
          } else {
            set({ loading: false })
            return { success: false, error: 'Invalid access code. Please try again.' }
          }
        } catch (error) {
          console.error('Login error:', error)
          set({ loading: false })
          return { 
            success: false, 
            error: 'An unexpected error occurred. Please try again.' 
          }
        }
      },

      signOut: async () => {
        set({ loading: true })
        
        try {
          const currentUser = get().user
          
          // Handle admin logout (no Supabase session to clear)
          if (currentUser?.id === 'admin-user') {
            set({ 
              user: null, 
              session: null, 
              loading: false 
            })
            return
          }
          
          // Regular Supabase logout
          await supabase.auth.signOut()
          set({ 
            user: null, 
            session: null, 
            loading: false 
          })
        } catch (error) {
          console.error('Sign out error:', error)
          set({ loading: false })
        }
      },


      initialize: async () => {
        set({ loading: true })
        
        try {
          const { data: { session }, error } = await supabase.auth.getSession()
          
          if (error) {
            console.error('Session error:', error)
            set({ loading: false, initialized: true })
            return
          }

          if (session?.user) {
            // Fetch consultant profile
            const { data: profile, error: profileError } = await supabase
              .from('consultants')
              .select('*')
              .eq('email', session.user.email)
              .single()

            if (!profileError && profile) {
              const userWithProfile: AuthUser = {
                ...session.user,
                consultant_profile: profile
              }
              
              set({ 
                user: userWithProfile, 
                session,
                loading: false,
                initialized: true
              })
            } else {
              set({ 
                user: session.user, 
                session,
                loading: false,
                initialized: true
              })
            }
          } else {
            set({ 
              user: null, 
              session: null, 
              loading: false,
              initialized: true
            })
          }

          // Listen for auth changes
          supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
              // Fetch consultant profile
              const { data: profile, error: profileError } = await supabase
                .from('consultants')
                .select('*')
                .eq('email', session.user.email)
                .single()

              if (!profileError && profile) {
                const userWithProfile: AuthUser = {
                  ...session.user,
                  consultant_profile: profile
                }
                
                set({ 
                  user: userWithProfile, 
                  session 
                })
              } else {
                set({ 
                  user: session.user, 
                  session 
                })
              }
            } else {
              set({ 
                user: null, 
                session: null 
              })
            }
          })
        } catch (error) {
          console.error('Auth initialization error:', error)
          set({ loading: false, initialized: true })
        }
      },

      updateProfile: async (data: Partial<AuthUser['consultant_profile']>) => {
        const { user } = get()
        if (!user?.consultant_profile?.id) return

        try {
          const { error } = await supabase
            .from('consultants')
            .update(data)
            .eq('id', user.consultant_profile.id)

          if (!error && user.consultant_profile) {
            set({
              user: {
                ...user,
                consultant_profile: {
                  ...user.consultant_profile,
                  ...data
                }
              }
            })
          }
        } catch (error) {
          console.error('Profile update error:', error)
        }
      },

      // Getters
      isAuthenticated: () => {
        return get().user !== null
      },

      getUserRole: () => {
        const { user } = get()
        return user?.consultant_profile?.role || null
      },

      hasPermission: (requiredRole: UserRole | UserRole[]) => {
        const currentRole = get().getUserRole()
        if (!currentRole) return false

        const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
        const currentLevel = roleHierarchy[currentRole]
        
        return requiredRoles.some(role => currentLevel >= roleHierarchy[role])
      },

      isManager: () => {
        return get().hasPermission(['manager', 'admin'])
      },

      isConsultant: () => {
        return get().hasPermission(['consultant', 'manager', 'admin'])
      },

      isReception: () => {
        return get().hasPermission(['reception', 'consultant', 'manager', 'admin'])
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
      }),
    }
  )
)