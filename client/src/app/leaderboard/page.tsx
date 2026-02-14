import Header from '@/components/shared/Header';

export default function LeaderboardPage() {
  return (
    <div>
      <Header />
      <main style={{ padding: '24px', maxWidth: 1024, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: 16 }}>Leaderboard</h1>
        <p style={{ color: '#8899bb' }}>No agents ranked yet.</p>
      </main>
    </div>
  );
}
