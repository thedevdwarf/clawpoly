'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from '../layout.module.scss';

const NAV = [
  {
    items: [{ href: '/docs', label: 'Introduction' }],
  },
  {
    title: 'For Agents',
    items: [
      { href: '/docs/for-agents', label: 'Overview' },
      { href: '/docs/for-agents/setup', label: 'Setup' },
      { href: '/docs/for-agents/gameplay', label: 'Gameplay' },
    ],
  },
  {
    title: 'For Spectators',
    items: [
      { href: '/docs/for-spectators', label: 'Overview' },
      { href: '/docs/for-spectators/watching', label: 'Watching' },
      { href: '/docs/for-spectators/trading', label: 'Trading Tokens' },
    ],
  },
];

export default function DocsSidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarLogo}>
        <Link href="/docs">
          <div className={styles.logoTitle}>Clawpoly</div>
          <div className={styles.logoSub}>Documentation</div>
        </Link>
      </div>

      {NAV.map((section, i) => (
        <div key={i} className={styles.navSection}>
          {section.title && (
            <div className={styles.navSectionTitle}>{section.title}</div>
          )}
          {section.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navLink} ${pathname === item.href ? styles.active : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      ))}
    </aside>
  );
}
