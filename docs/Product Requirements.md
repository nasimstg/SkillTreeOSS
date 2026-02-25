# 1. Product Requirements Document (PRD)

**Project Name:** The Skill-Tree
**Version:** 1.0.0
**Objective:** To provide an interactive, gamified learning platform where complex disciplines are mapped into visual "skill trees" connected to the internet's best free resources.

### Target Personas

* **The Learner:** Self-taught individuals overwhelmed by disjointed tutorials who need clear direction and a sense of progression.
* **The Contributor (Subject Matter Expert):** Wants to share their learning path but doesn't want to build a whole website, needing an easy way to submit a JSON/Markdown file.
* **The Maintainer:** Needs to review Pull Requests (PRs) quickly and ensure no malicious links are merged.

### Core User Stories

* As a *Learner*, I want to click a node to see the best free resource so I don't waste time searching.
* As a *Learner*, I want to mark nodes as "Completed" to track my progress and see the next available branches.
* As a *Learner*, I want to upvote/downvote a resource if it is broken or outdated.
* As a *Contributor*, I want to submit a new skill tree via a standard JSON file.
* As a *Learner*, I want to authenticate via GitHub or Google to save my learning progress across devices.
* As a *Learner*, I want to generate a shareable visual summary of my completed skill tree for my professional network.

### Success Metrics

| Metric | Description | Target (Q1) |
| --- | --- | --- |
| **User Retention** | Percentage of users returning to mark a second node as completed within 7 days. | 25% |
| **Open Source Health** | Number of merged community PRs adding new trees or fixing links. | 50 PRs |
| **Platform Stability** | Uptime of the Next.js frontend and Supabase backend. | 99.9% |