
// ============================================================================
// AUTH HOOKS
// ============================================================================

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import * as api from '../api/auth';
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// --------- useAuth -----------
export function useAuth() {
    const router = useRouter()
    const [token, setToken] = useState<string | null>(() => {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('auth_token')
      }
      return null
    })
    const [orgId, setOrgId] = useState<string | null>(() => {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('org_id')
      }
      return null
    })

    const loginMutation = useMutation({
      mutationFn: async ({ email, password }: { email: string; password: string }) => {
        const accessToken = await api.login(email, password)
        const userOrgId = await api.getOrgId(accessToken)
        return { accessToken, userOrgId }
      },
      onSuccess: ({ accessToken, userOrgId }: { accessToken: string; userOrgId: string }) => {
        setToken(accessToken)
        setOrgId(userOrgId)
        localStorage.setItem('auth_token', accessToken)
        localStorage.setItem('org_id', userOrgId)
        toast.success('Login successful!')
        router.push('/dashboard')
      },
      onError: (error: Error) => {
        console.error('Login failed:', error)
        toast.error('Login failed. Please check your credentials.')
      }
    })

    const logout = () => {
      setToken(null)
      setOrgId(null)
      localStorage.removeItem('auth_token')
      localStorage.removeItem('org_id')
    }

    return {
      token,
      orgId,
      login: loginMutation.mutate,
      logout,
      isLoading: loginMutation.isPending,
      isAuthenticated: !!token,
      error: loginMutation.error
    }
  }