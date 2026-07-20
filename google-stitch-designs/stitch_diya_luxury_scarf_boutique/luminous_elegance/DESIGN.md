---
name: Luminous Elegance
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0edec'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#4f4634'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#817662'
  outline-variant: '#d2c5ae'
  surface-tint: '#785a00'
  primary: '#785a00'
  on-primary: '#ffffff'
  primary-container: '#bf9001'
  on-primary-container: '#3e2d00'
  inverse-primary: '#f3bf3d'
  secondary: '#6c5e00'
  on-secondary: '#ffffff'
  secondary-container: '#f4e07a'
  on-secondary-container: '#716300'
  tertiary: '#5d5f5f'
  on-tertiary: '#ffffff'
  tertiary-container: '#969797'
  on-tertiary-container: '#2e3030'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdf9d'
  primary-fixed-dim: '#f3bf3d'
  on-primary-fixed: '#251a00'
  on-primary-fixed-variant: '#5b4300'
  secondary-fixed: '#f7e37c'
  secondary-fixed-dim: '#dac763'
  on-secondary-fixed: '#211c00'
  on-secondary-fixed-variant: '#514700'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '400'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 36px
    fontWeight: '400'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.2'
  headline-sm:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '400'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.0'
    letterSpacing: 0.15em
  nav-link:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.0'
    letterSpacing: 0.05em
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 60px
---

## Brand & Style

The design system is rooted in the concept of "An-Nur" (The Light), translating the spiritual essence of radiance into a premium digital experience. The brand personality is serene, sophisticated, and intentionally spacious, catering to a discerning audience that values both modesty and luxury.

The visual style is a blend of **High-End Minimalism** and **Editorial Luxury**. It prioritizes extreme clarity, generous whitespace, and a "lit-from-within" quality. By utilizing high-contrast typography and a restrained color palette, the UI acts as a gallery-grade frame for the product photography, ensuring the textures and drapes of the scarves remain the focal point.

## Colors

The palette is anchored by **Tekon Gold**, a deep, authoritative metallic tone that signifies premium quality. This is complemented by **Light Gold**, used sparingly to create "shimmer" effects, highlights, or soft backgrounds for promotional callouts.

- **Primary (Tekon Gold):** Used for primary actions, branding, active states, and critical indicators like sale badges or star ratings.
- **Secondary (Light Gold):** Used for subtle hover states, soft dividers, or decorative luminous accents.
- **Background (White):** A pure, crisp white base to maximize the "Light" theme.
- **Text (Off-Black):** A softened black to maintain high legibility while appearing more sophisticated than a harsh #000000.

## Typography

The typography strategy relies on the interplay between the classical authority of **Playfair Display** and the modern, geometric precision of **Plus Jakarta Sans** (a refined alternative to Jost that excels in digital legibility). 

To maintain the "Luxury" feel while restricted to Regular weights:
1. **Scale:** Use dramatic size differences between headlines and body text.
2. **Letter Spacing:** Apply wide tracking to labels and navigation items to evoke an airy, boutique feel.
3. **Leading:** Use generous line heights for body text to improve the reading rhythm and reinforce the sense of calm.

## Layout & Spacing

The layout follows a **Fluid Grid** system with expansive outer margins to push content toward the center, mimicking the layout of a luxury fashion magazine.

- **Desktop:** A 12-column grid with a maximum container width of 1280px. Gutters are kept wide (24px) to ensure no element feels crowded.
- **Mobile:** A 4-column grid with 20px side margins. Vertical spacing between sections should be aggressive (e.g., 80px+) to maintain the minimalist aesthetic.
- **Rhythm:** All spacing (padding, margins) is derived from an 8px base unit. Use larger increments (32px, 48px, 64px) for layout sections to enforce the "unhurried" luxury feel.

## Elevation & Depth

To align with the "Light" theme, depth is created through **Tonal Layers** and **Luminous Shadows** rather than heavy occlusion.

- **Surface Strategy:** Backgrounds are primarily pure white. Secondary surfaces (like quick-view modals or side carts) use a very faint #F9F9F9 to create a subtle stack effect.
- **Shadows:** Use "Ambient Glow" shadows. These are ultra-diffused, high-blur (20px-40px), and low-opacity (5-8%). The shadow color should have a microscopic tint of the primary gold to make elements feel like they are floating on a warm light source.
- **Interactions:** Hovering over product cards should not lift them harshly; instead, the shadow should slightly expand and soften, creating a "glow" rather than a "drop."

## Shapes

This design system utilizes **Sharp (0px)** corners. The architectural rigidity of sharp edges communicates high-fashion, precision, and luxury. It contrasts beautifully with the soft, flowing nature of the hijab and scarf fabrics featured in the photography. 

All buttons, input fields, image containers, and badges must maintain a strict 90-degree angle.

## Components

### Buttons
- **Primary:** Tekon Gold (#BF9001) background, White text. No border. All caps with 0.1em letter spacing.
- **Secondary:** White background, 1px Tekon Gold border, Off-Black text.
- **Ghost:** Off-Black text with a 1px underline that appears only on hover.

### Product Cards
- **Structure:** Full-bleed image at the top, followed by center-aligned typography below. 
- **Details:** The product name in Playfair Display, price in Plus Jakarta Sans. 
- **Sale Badges:** Small rectangular tags in Tekon Gold with White text, positioned in the top-right corner of the image.

### Navigation
- **Top Bar:** Minimalist center-aligned logo. Left-aligned menu categories and right-aligned utility icons (Search, Account, Cart).
- **Active State:** The current page link is indicated by a Tekon Gold color change and a thin underline.

### Inputs & Forms
- **Fields:** 1px Off-Black bottom border only (no full box) to maintain a clean, airy look. Labels sit above the line in Label-Caps style.

### Star Ratings
- Rendered in Tekon Gold. Empty stars use a Light Gold outline. Always accompanied by the review count in a small body font.

### Lists & Accordions
- Used for "Product Details" or "Care Instructions." Separated by thin, 1px #EEE dividers. The toggle icon is a simple '+' or '-' in Tekon Gold.