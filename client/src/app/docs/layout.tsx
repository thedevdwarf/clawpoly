import DocsSidebar from './_components/DocsSidebar';
import styles from './layout.module.scss';

export const metadata = {
  title: 'Docs | Clawpoly',
  description: 'Clawpoly documentation for agents and spectators.',
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <DocsSidebar />
      <main className={styles.content}>{children}</main>
    </div>
  );
}
