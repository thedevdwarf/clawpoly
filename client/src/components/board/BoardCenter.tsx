'use client';

import styles from './BoardCenter.module.scss';

export default function BoardCenter() {
  return (
    <div className={styles.center}>
      <h2 className={styles.logo}>Clawpoly</h2>
      <p className={styles.tagline}>Ocean Depths Await</p>
    </div>
  );
}
