# Paralelná Polis Košice — Marketing

> Repozitár marketingových podkladov pre [Paralelná Polis Košice (PPKE)](https://www.paralelnapolis.sk/).

---

## O čom je tento repozitár

Tento repozitár slúži ako spoločný, transparentný priestor pre **marketingové materiály** Paralelnej Polis Košice. Každý priaznivec môže:

- **prezerať** pripravené podklady,
- **navrhovať úpravy** cez pull requesty,
- **reportovať problémy** cez Issues.

Repozitár je prepojený s interným systémom [Paperclip](https://paperclip.ing/), ktorý používa board PPKE na koordináciu úloh a agentov.

---

## Štruktúra repozitára

```
parallel-marketing/
│
├── content/                 # Marketingový obsah
│   ├── texts/               # Texty (príspevky, popisy, slogany)
│   ├── images/              # Obrázky a grafika
│   └── videos/              # Videá alebo linky na videá (markdown)
│
├── templates/               # Šablóny
│   ├── newsletter/          # HTML/CSS šablóny pre Mailchimp newsletter
│   └── social/              # Šablóny pre sociálne siete
│
├── docs/                    # Dokumentácia a príručky
│   ├── channels.md          # Prehľad marketingových kanálov
│   ├── mailchimp.md         # Postup nastavenia Mailchimp integrácie
│   └── workflows.md         # Pracovné postupy (kto čo robí a kedy)
│
├── assets/                  # Zdieľané súbory (logá, fonty, farby)
│
├── .env.example             # Príklad environment premenných (bez reálnych kľúčov!)
├── .gitignore               # Git ignore pravidlá
└── README.md                # Tento súbor
```

---

## Ako prispievať

### Netechnickí prispievatelia

1. Ak chceš navrhnúť zmenu alebo pridať materiál, otvor **Issue** (záložka Issues hore).
2. Popiš, čo chceš zmeniť a prečo.
3. Člen tímu ti odpovie a pomôže s ďalšími krokmi.

### Technickí prispievatelia

1. Forkni repozitár a vytvor novú vetvu:
   ```bash
   git checkout -b feature/nazov-zmeny
   ```
2. Urob zmeny a commitni ich:
   ```bash
   git add .
   git commit -m "popis zmeny"
   ```
3. Pošli Pull Request do vetvy `main`.
4. Počkaj na review od člena tímu.

---

## Nastavenie prostredia (pre vývojárov)

Ak pracuješ s integráciami (napr. Mailchimp API), potrebuješ konfiguráciu:

1. Skopíruj `.env.example` do `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Vyplň reálne hodnoty v `.env.local` — **nikdy tento súbor necommituj do Gitu**.
3. Ak nevieš, kde získať potrebné kľúče, opýtaj sa boardu PPKE.

> **BEZPEČNOSTNÉ PRAVIDLO:** Do tohto repozitára **nikdy** nepatria skutočné API kľúče, heslá ani iné citlivé údaje. Iba súbor `.env.example` s ukážkovými hodnotami.

---

## Kontakt a koordinácia

- **Board PPKE**: spravuje túto inštanciu Paperclip a má finálne slovo v stratégii.
- **Paperclip systém**: interná platforma na priraďovanie a sledovanie úloh.
- **Issues v tomto repozitári**: verejný komunikačný kanál pre návrhy a reporty.

---

## Licencia

Materiály v tomto repozitári sú zdieľané pod licenciou [Creative Commons BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.sk), pokiaľ nie je pri konkrétnom súbore uvedené inak.
