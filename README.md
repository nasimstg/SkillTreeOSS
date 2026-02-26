# 🌳 The Skill-Tree

**The Democratization of Mastery.** The Skill-Tree is an open-source, gamified learning platform. We map out complex skills (like "Full-Stack Developer," "Botanist," or "Urban Sketcher") into beautiful, interactive RPG-style skill trees. Click a node, find the absolute best free resource on the internet, and level up your life in the real world.

---

## 🎯 The Vision

Most learning sites are either hidden behind expensive paywalls or are overwhelming, messy lists of links. Self-learners often face a "curriculum gap"—they don't know *what* they should learn next.

The Skill-Tree solves this by turning education into a visual progression system.

* **Zero Overwhelm:** See exactly where you are and what to tackle next.
* **Community Curated:** Nodes link to the single highest-voted free resource (YouTube, interactive tutorials, articles) for that specific sub-skill.
* **Gamified Progression:** Watch your tree light up as you complete nodes, unlocking advanced branches.

---

## 🛠️ Tech Stack

We chose a modern, performant, and contributor-friendly stack:

* **Framework:** Next.js (App Router)
* **Language:** TypeScript
* **Canvas Engine:** React Flow (by xyflow)
* **State Management:** Zustand
* **Styling:** Tailwind CSS + shadcn/ui + Framer Motion
* **Database & Auth:** Supabase
* **Data Validation:** Zod

---

## 🚀 Quick Start (Local Development)

Want to run The Skill-Tree locally? Follow these steps:

1. **Clone the repository**
```bash
git clone https://github.com/nasimstg/SkillTreeOSS.git
cd SkillTreeOSS

```


2. **Install dependencies**
```bash
npm install

```


3. **Set up environment variables**
Copy the example environment file and add your local/test Supabase keys.
```bash
cp .env.local.example .env.local

```


4. **Run the development server**
```bash
npm run dev

```


Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) in your browser to see the result.

---

## 🤝 How to Contribute

The heart of this project is the community. You **do not** need to be a React developer to contribute! The actual skill trees are generated from simple JSON files.

**Want to add a new skill tree or fix a broken YouTube link?**

1. Navigate to the `data/trees/` directory.
2. Duplicate an existing JSON file or edit one to update a resource link.
3. Follow the schema rules (e.g., ensuring your node has `x` and `y` coordinates).
4. Submit a Pull Request!

For a detailed guide on how the JSON schema works and how to structure a tree, please read our full **[CONTRIBUTING.md](https://www.google.com/search?q=./CONTRIBUTING.md)**.

**Are you a developer?**
Check out the **Issues** tab for labels like `good first issue` or `help wanted` to tackle UI improvements, animation tweaks, or Supabase integrations.

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](https://www.google.com/search?q=LICENSE) file for details. Education should be free, and so is this code.

---