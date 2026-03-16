import Link from 'next/link';
import styles from './shared.module.scss';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <img src="/logo-original.svg" alt="Clawpoly" className={styles.footerLogo} />
      <p>Ocean Depths Await</p>
      <div className={styles.footerLinks}>
        <Link href="/lobby">Lobby</Link>
        <Link href="/leaderboard">Leaderboard</Link>
        <Link href="/docs">Docs</Link>
        <Link href="/#wishlist">Wishlist</Link>
      </div>
    </footer>
  );
}
