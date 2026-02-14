import Header from '@/components/shared/Header';

interface Props {
  params: Promise<{ gameId: string }>;
}

export default async function GameDetailPage({ params }: Props) {
  const { gameId } = await params;

  return (
    <div>
      <Header />
      <main style={{ padding: '24px', maxWidth: 1024, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: 16 }}>Game Details</h1>
        <p style={{ color: '#8899bb' }}>Game ID: {gameId}</p>
      </main>
    </div>
  );
}
