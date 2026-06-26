---
name: googlestick code to react converter
description: guidelines and workflows to parse, convert, and integrate Google Stitch HTML/CSS designs into clean, responsive React + Tailwind CSS components.
---

# Google Stitch Code to React Converter

This skill outlines the process of importing, parsing, and converting Google Stitch HTML design templates into modern React components.

## Workflow

1. **Locate Designs**:
   - Find the extracted design files inside the `google-stitch-designs/` directory.
   - Inspect their structure (HTML, CSS files, assets).

2. **Deconstruct layouts**:
   - Break down page-level HTML designs into clean, reusable React components.
   - Identify which blocks correspond to:
     - Global components (e.g., Navbar, Footer, Button) -> place in `shared/components/`.
     - Feature components (e.g., ProductCard, ProductGrid, CartSummary) -> place in `features/<feature-name>/components/`.

3. **Convert to JSX**:
   - Rename attributes: `class` -> `className`, `for` -> `htmlFor`, etc.
   - Clean up inline styles or resolve them using CSS variables/Tailwind classes.
   - Convert standard relative paths for images/icons into dynamic React imports or place assets in the public folder.

4. **Tailwind Translation**:
   - If the designs use raw CSS styles, map standard styles to utility classes where appropriate, or preserve class names by importing the stylesheet under the component or layout.
   - Ensure clean Tailwind usage: `flex`, `grid`, `gap`, responsive breakpoints (`sm:`, `md:`, `lg:`).

5. **Strict Boundary Compliance**:
   - Verify that any converted components placed inside `features/` do not violate ESLint boundaries. They can import from `shared/` but never directly from other feature folders.
