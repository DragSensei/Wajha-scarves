# Workspace Guidelines for Agents

Welcome! This document defines the rules and style guidelines for AI agents working on the **Wajha Scarves** project.

## Project Architecture

This project is a React + Vite + Tailwind CSS frontend with a Python Flask backend. We enforce a strict **feature-based folder structure** with import boundaries:

1. **Root Structure**:
   - `app/`: Core application logic (App shell, entry points, routers, global styling).
   - `features/`: The directory for all domain business logic (e.g., `products/`, `cart/`). Each unique feature lives here.
   - `shared/`: Non-feature-specific common code (global components, lib helpers, DB connections, utilities).
   - `api/`: Global Flask API backend handlers (`api/index.py` for Vercel Serverless Functions).
   - `google-stitch-designs/`: Extra folder for unzipping Google Stitch HTML designs.

2. **Boundary Rules (Enforced via ESLint)**:
   - **Shared** code can only import from other **Shared** files.
   - **Features** can import from **Shared** code and other files within their *own* feature folder (e.g., `features/products/`), but *cannot* import from other features.
   - **App** can import from both **Shared** code and **Features**.

## Instructions for Agents
- When creating a new feature, place it inside `features/<feature-name>/`.
- Avoid direct cross-feature imports. If features need to communicate, use React Context, state managers, or lift state to the `app/` layer.
- Run `npm run lint` before completing tasks to verify there are no boundary violations.
- Ensure python dependencies are added to `requirements.txt`.
