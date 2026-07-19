# Sentinel Mesh Faz 2 — Hızlı Başlangıç

## 1. Gerekenler

- Node.js 22 veya üzeri
- npm
- Git

## 2. Çalıştırma

```bash
npm install
npm run dev
```

Tarayıcıda `http://localhost:3000` adresini aç.

## 3. Tarama

Public bir GitHub repository URL'si gir ve **Run real scan** butonuna bas. İlk tarama repository boyutuna ve internet hızına göre zaman alabilir.

## 4. Ücretsiz scanner seçenekleri

Harici araç kurmadan Sentinel built-in scanner çalışır. Daha geniş analiz için bilgisayarına şu ücretsiz araçları kurabilirsin:

- Semgrep
- Gitleaks
- OSV-Scanner

Sistem kurulu araçları otomatik algılar. API key gerekmez.

## 5. Önemli

Scanner binary'leri ve `node_modules` ZIP'e eklenmemiştir. Bu nedenle proje paketi küçük kalır.
