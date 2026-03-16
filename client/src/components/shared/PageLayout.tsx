import Header from './Header';
import Footer from './Footer';
import styles from './shared.module.scss';

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.pageContent}>
        {children}
      </div>
      <Footer />
    </div>
  );
}
