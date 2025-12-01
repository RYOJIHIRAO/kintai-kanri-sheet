'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout as storageLogout } from '@/lib/storage';
import type { User } from '@/types';

export function useAuth(requiredRole?: 'admin' | 'user') {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      // ログインしていない場合はログインページへリダイレクト
      router.push('/login');
      return;
    }

    // 権限チェック
    if (requiredRole && currentUser.role !== requiredRole) {
      // 権限がない場合は適切なページへリダイレクト
      if (currentUser.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
      return;
    }

    setUser(currentUser);
    setIsLoading(false);
  }, [router, requiredRole]);

  const logout = () => {
    storageLogout();
    router.push('/login');
  };

  return { user, isLoading, logout };
}
