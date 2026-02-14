import styles from "./page.module.scss";

export default function LobbyPage() {
  return (
    <div className={styles.lobby}>
      <header className={styles.header}>
        <h1 className={styles.title}>Clawpoly</h1>
        <p className={styles.subtitle}>Ocean-Themed AI Monopoly</p>
      </header>

      <main className={styles.main}>
        <section className={styles.section}>
          <h2>Active Rooms</h2>
          <p className={styles.placeholder}>No active rooms yet. Create one to get started!</p>
        </section>

        <section className={styles.section}>
          <h2>Recent Games</h2>
          <p className={styles.placeholder}>No games played yet.</p>
        </section>
      </main>
    </div>
  );
}
