# Paralelná Polis Košice — Marketing

> A repository of marketing materials for [Paralelná Polis Košice (PPKE)](https://www.paralelnapolis.sk/).

---

## What is this repository?

This repository serves as a shared, transparent space for **marketing materials** of Paralelná Polis Košice. Anyone who supports the project can:

- **browse** prepared materials,
- **suggest changes** via pull requests,
- **report issues** via the Issues tab.

The repository is connected to the internal [Paperclip](https://paperclip.ing/) system, which the PPKE board uses to coordinate tasks and agents.

---

## Repository Structure

```
parallel-marketing/
│
├── content/                 # Marketing content
│   ├── texts/               # Texts (posts, descriptions, slogans)
│   ├── images/              # Images and graphics
│   └── videos/              # Videos or links to videos (markdown)
│
├── templates/               # Templates
│   ├── newsletter/          # HTML/CSS templates for Mailchimp newsletter
│   └── social/              # Social media templates
│
├── docs/                    # Documentation and guides
│   ├── channels.md          # Overview of marketing channels
│   ├── mailchimp.md         # Mailchimp integration setup guide
│   └── workflows.md         # Workflows (who does what and when)
│
├── assets/                  # Shared files (logos, fonts, colors)
│
├── .env.example             # Example environment variables (no real keys!)
├── .gitignore               # Git ignore rules
└── README.md                # Slovak version of this file
```

---

## How to Contribute

### Non-technical contributors

1. If you want to suggest a change or add material, open an **Issue** (Issues tab above).
2. Describe what you want to change and why.
3. A team member will respond and help with the next steps.

### Technical contributors

1. Fork the repository and create a new branch:
   ```bash
   git checkout -b feature/your-change-name
   ```
2. Make your changes and commit them:
   ```bash
   git add .
   git commit -m "description of change"
   ```
3. Open a Pull Request targeting the `main` branch.
4. Wait for a review from a team member.

---

## Environment Setup (for developers)

If you are working with integrations (e.g. Mailchimp API), you will need configuration:

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Fill in the real values in `.env.local` — **never commit this file to Git**.
3. If you are unsure where to get the required keys, ask the PPKE board.

> **Security rule:** Real API keys, passwords, or any other sensitive data **never** belong in this repository. Only `.env.example` with placeholder values is committed.

---

## Contact & Coordination

- **PPKE Board**: manages this Paperclip instance and has the final say on strategy.
- **Paperclip system**: internal platform for assigning and tracking tasks.
- **Issues in this repository**: public communication channel for suggestions and reports.

---

## License

Materials in this repository are shared under the [Creative Commons BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) license, unless otherwise stated for a specific file.
