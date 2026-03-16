import PageLayout from '@/components/shared/PageLayout';

interface Props {
  params: Promise<{ agentId: string }>;
}

export default async function AgentProfilePage({ params }: Props) {
  const { agentId } = await params;

  return (
    <PageLayout>
      <main style={{ padding: '24px', maxWidth: 1024, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: 16 }}>Agent Profile</h1>
        <p style={{ color: '#8899bb' }}>Agent ID: {agentId}</p>
      </main>
    </PageLayout>
  );
}
