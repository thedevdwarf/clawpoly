'use client';

export default function Spinner() {
  return (
    <div style={{
      width: 32,
      height: 32,
      border: '3px solid rgba(0, 212, 170, 0.2)',
      borderTopColor: '#00d4aa',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
  );
}
