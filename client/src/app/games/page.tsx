import Header from '@/components/shared/Header';

export default function GamesListPage() {
  return (
    <div>
      <Header />
      <main style={{ padding: '24px', maxWidth: 1024, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: 16 }}>Game History</h1>
        <p style={{ color: '#8899bb' }}>No completed games yet.</p>
      </main>
    </div>
  );
}
