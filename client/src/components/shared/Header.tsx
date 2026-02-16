'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 24px',
      borderBottom: '1px solid rgba(232, 240, 255, 0.08)',
    }}>
      <Link href="/" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#00d4aa' }}>
        Clawpoly
      </Link>
      <nav style={{ display: 'flex', gap: '16px' }}>
        <Link href="/lobby">Lobby</Link>
        <Link href="/games">Games</Link>
        <Link href="/leaderboard">Leaderboard</Link>
      </nav>
    </header>
  );
}
