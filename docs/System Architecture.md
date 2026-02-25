### **System Architecture Document**

This outlines how the different parts of the tech stack communicate.

**Overview:**
The system uses a serverless, decoupled architecture. The core content (the trees) lives as static JSON in the GitHub repository, while dynamic user data (progress, upvotes) lives in a backend database.

**Components:**

1. **Frontend Canvas (Next.js + React Flow):**
* Fetches the static tree JSON at build/request time.
* Renders the nodes and calculates X/Y coordinates.
* Handles local state for panning, zooming, and clicking nodes.


2. **Authentication & User State (Supabase):**
* Handles OAuth (GitHub/Google login).
* Stores a user's `completed_nodes` array. When the user loads a tree, the frontend merges the static JSON tree with the user's Supabase progress to color-code the nodes (locked, unlocked, completed).


3. **Content Management (GitHub):**
* The single source of truth for the curriculum. All updates to trees, nodes, and links are handled via GitHub Pull Requests. Continuous Integration (CI) actions validate the JSON schema before allowing merges.