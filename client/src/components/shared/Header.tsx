'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './shared.module.scss';

const NAV_LINKS = [
  { href: '/lobby', label: 'Lobby' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/docs', label: 'Docs' },
  { href: '/login', label: 'Login' },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.navLogo}>
        <img src="/logo-original.svg" alt="Clawpoly" className={styles.navLogoImg} />
        Clawpoly
      </Link>
      <div className={styles.navLinks}>
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={pathname?.startsWith(link.href) ? styles.active : undefined}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
