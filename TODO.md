# Clawpoly — TODO List

Roadmap sırası: **Mock Agents → Basic Gameplay Solid → AI Agents → Onchain**

---

## 🔴 Phase 1: Çalışır Hale Getir (BLOCKER)

- [ ] **Redis + MongoDB kur** — Homebrew veya Docker ile lokal ortam
- [ ] **E2E test** — Server başlat, mock agent bağla, oyun baştan sona oyna
- [ ] **Bug fix: collectFromEach iflas durumu** — İflas eden oyuncudan tam ödeme alınamıyor (`gameEngine.ts:458-471`)
- [ ] **Bug fix: Net worth tie-breaking** — Eşit net worth'te ilk bulunan kazanıyor, düzgün tie-break ekle
- [ ] **Unmortgage mekanizması** — Şu an sadece iflas sırasında otomatik mortgage var, gönüllü mortgage/unmortgage yok

---

## 🟡 Phase 2: Gameplay Kalitesi

### Eksik Mekanikler
- [ ] **Müzayede sistemi** — Reddedilen mülk müzayedeye çıksın (en büyük strateji eksikliği)
- [ ] **Gönüllü mortgage/unmortgage** — Agent karar noktası olarak ekle
- [ ] **Gönüllü bina satışı** — Agent istediğinde bina satabilsin (sadece iflas sırasında değil)
- [ ] **Agent timeout enforcement** — `consecutiveTimeouts` tracked ama 5-timeout-to-bankrupt kuralı uygulanmıyor

### Denge Ayarları
- [ ] **Treasure Chest vs Tide Card dengeleme** — TC çok cömert (net +635), Tide daha negatif
- [ ] **Fortress satış kuralı** — Outpost geri gelmemesi çok ağır ceza, gözden geçir
- [ ] **Bina kıtlığı (opsiyonel)** — Sınırsız outpost/fortress strateji derinliğini azaltıyor
- [ ] **Speed config uyumu** — `config.ts` vs tasarım dokümanı uyumsuz

### Agent Geliştirme
- [ ] **SmartAgent** — Renk grubu tamamlama, nakit rezerv yönetimi, ROI hesabı yapan agent
- [ ] **AggressiveAgent** — Her şeyi alan, hızlı inşaat yapan
- [ ] **ConservativeAgent** — Nakit biriktiren, seçici alan
- [ ] **Agent karar noktaları genişlet** — Hangi binayı satacağını, ne zaman ipotek edeceğini seçebilsin

---

## 🟢 Phase 3: Frontend & İzleyici Deneyimi

### Eksik UI Bileşenleri
- [ ] **DiceDisplay** — Zar animasyonu
- [ ] **BuildingMarkers** — Tahtada outpost/fortress gösterimi
- [ ] **CardOverlay** — Çekilen kartı göster
- [ ] **AgentToken** — Oyuncu token'ları tahta üzerinde
- [ ] **RollOrderView** — Başlangıç sıralama ekranı
- [ ] **GameOverOverlay** — Oyun sonu sıralaması + istatistikler

### Spectator İyileştirmeleri
- [ ] **Replay sistemi** — Bitmiş oyunları tekrar izle
- [ ] **Delta-based state sync** — Her event'te full state yerine diff gönder (bandwidth)
- [ ] **Event mutation fix** — roomManager event.data'yı doğrudan mutate ediyor
- [ ] **Spectator speed control** — İzleyici kendi hızını ayarlayabilsin

---

## 🔵 Phase 4: AI Agent Entegrasyonu

- [ ] **OpenClaw agent protokolü** — WebSocket üzerinden AI agent bağlantısı
- [ ] **LLM-based agent** — GPT/Claude ile karar veren agent
- [ ] **Agent personality sistemi** — Her agent'a farklı strateji/kişilik
- [ ] **Agent vs Agent turnuva modu** — Birden fazla oyun, ELO sıralaması

---

## 🟣 Phase 5: Premium & Onchain

- [ ] **Kripto giriş ücreti** — Solana/ETH ile ödeme
- [ ] **Prize pool mekanizması** — Giriş ücretleri → havuz → kazanana dağıtım
- [ ] **%10 platform komisyonu** — Otomatik kesim
- [ ] **Smart contract** — Ödeme güvencesi, şeffaf havuz
- [ ] **Anti-cheat** — Agent davranış doğrulama, manipülasyon tespiti

---

## 🛠️ Altyapı & DevOps

- [ ] **Docker Compose** — Redis + MongoDB + Server + Client tek komutla ayağa kalksın
- [ ] **CI/CD pipeline** — GitHub Actions ile test + deploy
- [ ] **TypeScript strict mode** — Tip güvenliğini sıkılaştır
- [ ] **Test suite** — Engine unit testleri (özellikle rent, bankruptcy, card executor)
- [ ] **Linting + formatting** — ESLint + Prettier standartlaştır

---

## ✅ Tamamlanan

- [x] Server Phase 1 (engine, room manager, WS, MongoDB persist)
- [x] Server-client kontrat düzeltmeleri
- [x] Doküman hizalama
- [x] Frontend Phase 2 (lobby, board, spectator UI)
- [x] Pause/resume fix
- [x] Delete room butonu
- [x] Game loop condition fix
- [x] Game mechanics analizi (GAME_MECHANICS_ANALYSIS.md)
