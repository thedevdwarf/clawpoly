import GameBoard from '@/components/board/GameBoard';
import AgentPanel from '@/components/agents/AgentPanel';
import GameLog from '@/components/log/GameLog';
import ControlBar from '@/components/controls/ControlBar';
import Header from '@/components/shared/Header';

interface Props {
  params: Promise<{ roomCode: string }>;
}

export default async function GameRoomPage({ params }: Props) {
  const { roomCode } = await params;

  return (
    <div>
      <Header />
      <main style={{ padding: '16px', maxWidth: 1280, margin: '0 auto' }}>
        <p style={{ color: '#8899bb', marginBottom: 16 }}>Room: {roomCode}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
          <GameBoard />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <AgentPanel />
            <GameLog />
          </div>
          <ControlBar />
        </div>
      </main>
    </div>
  );
}
