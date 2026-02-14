import Header from '@/components/shared/Header';

interface Props {
  params: Promise<{ gameId: string }>;
}

export default async function ReplayPage({ params }: Props) {
  const { gameId } = await params;

  return (
    <div>
      <Header />
      <main style={{ padding: '24px', maxWidth: 1280, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: 16 }}>Replay</h1>
        <p style={{ color: '#8899bb' }}>Game ID: {gameId} — Replay coming soon</p>
      </main>
    </div>
  );
}
