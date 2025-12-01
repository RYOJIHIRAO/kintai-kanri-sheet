'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // トップページにアクセスした場合、ログインページにリダイレクト
    router.push('/login');
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">勤怠管理システム</h1>
      <p className="text-lg text-muted-foreground">
        リダイレクト中...
      </p>
    </main>
  );
}
