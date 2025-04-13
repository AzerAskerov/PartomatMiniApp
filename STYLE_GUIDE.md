# PartoMat - Style Guide

This document outlines the visual design language, components, and guidelines for the PartoMat Telegram Mini App.

## Brand Identity

*   **App Name:** PartoMat
*   **Logo:** Arrow icon within a blue circle (Specific SVG/image TBD)
*   **Tagline:** "Avtomobil hissələri axtarışı"

## Color Palette

Based on Tailwind CSS color names where applicable.

*   **Primary:** `#2563eb` (Blue-600)
*   **Primary Variant (for pressed states, etc.):** `#1d4ed8` (Blue-700)
*   **Secondary (light backgrounds):** `#f9fafb` (Gray-50)
*   **Background:** `#ffffff` (White)
*   **Surface (cards, components):** `#ffffff` (White)
*   **Error:** `#ef4444` (Red-500)
*   **Success:** `#10b981` (Green-500)
*   **Warning:** `#f59e0b` (Amber-500)
*   **Info:** `#3b82f6` (Blue-500)
*   **Divider:** `#e5e7eb` (Gray-200)

*   **Text on Primary:** `#ffffff` (White)
*   **Text on Secondary:** `#1f2937` (Gray-800)
*   **Text on Background:** `#111827` (Gray-900)
*   **Text on Surface:** `#111827` (Gray-900)
*   **Text on Error:** `#ffffff` (White)
*   **Text Hint/Secondary:** `#6b7280` (Gray-500) - *Assumed, verify against Telegram hint color*
*   **Text Disabled:** `#9ca3af` (Gray-400) - *Assumed*

## Typography

*   **Base Font Family:** System default UI font (e.g., SF Pro for iOS, Roboto for Android).

**Scale & Weights:**

*   **H1 (Page Titles):** 24px, Bold (700)
*   **H2 (Section Titles):** 20px, Bold (700)
*   **H3 (Card Titles, Subsections):** 18px, Semibold (600)
*   **H4 (Smaller Titles):** 16px, Semibold (600)
*   **Body 1 (Standard text):** 16px, Regular (400)
*   **Body 2 (Secondary text, descriptions):** 14px, Regular (400)
*   **Button:** 14px, Medium (500)
*   **Label (Form labels):** 14px, Medium (500)
*   **Caption (Hints, small text):** 12px, Regular (400)

## Component Styles

### Buttons

*   **General:** Minimum tap target 44x44px.
*   **Primary Button:**
    *   Background: Primary (`#2563eb`)
    *   Text: On Primary (`#ffffff`)
    *   Border Radius: 8px
    *   Padding: 12px 16px
    *   Font: Button typography
    *   Pressed State: Darken background (e.g., Primary Variant `#1d4ed8`)
*   **Secondary Button:**
    *   Background: Surface (`#ffffff`)
    *   Border: 1px solid `#d1d5db` (Gray-300) - *Assumed Gray-300*
    *   Text: On Surface (`#111827`)
    *   Border Radius: 8px
    *   Padding: 12px 16px
    *   Font: Button typography
    *   Pressed State: Light Gray background (e.g., `#f3f4f6` Gray-100)
*   **Text Button:**
    *   Background: Transparent
    *   Text: Primary (`#2563eb`)
    *   Padding: 8px 12px (adjust for tap target)
    *   Font: Button typography
    *   Pressed State: Subtle background (e.g., Primary color with low alpha)

### Input Fields

*   **General:** Font Body 1, Text On Surface.
*   **Text Field / Dropdown Button:**
    *   Background: Secondary (`#f9fafb`)
    *   Border: 1px solid `#d1d5db` (Gray-300)
    *   Border Radius: 8px
    *   Padding: 12px 16px
    *   Icon Size (if present): 20px, color Gray-500 (`#6b7280`)
    *   Focus State: Border Primary (`#2563eb`), optional subtle box-shadow (`0 0 0 2px rgba(primary-rgb, 0.2)`)
    *   Error State: Border Error (`#ef4444`)
*   **Dropdown Menu:**
    *   Background: Surface (`#ffffff`)
    *   Border Radius: 8px (match text field)
    *   Shadow: Standard card shadow
    *   Padding: 4px 0 (vertical), items have own padding.
*   **Search Field:**
    *   Similar to Text Field, uses search icon.
    *   Border Radius: 12px (slightly more rounded if desired)

### Cards and Containers

*   **Standard Card:**
    *   Background: Surface (`#ffffff`)
    *   Border: 1px solid Divider (`#e5e7eb`)
    *   Border Radius: 12px
    *   Shadow: `0 1px 3px rgba(0, 0, 0, 0.08)`, `0 1px 2px rgba(0, 0, 0, 0.04)` - *Subtle*
    *   Padding: 16px
*   **Info Card:**
    *   As Standard Card, potentially with a colored left border or background tint based on type (Success, Warning, Error, Info).
*   **List Item:**
    *   Padding: 12px 16px
    *   Separator: Border-bottom 1px solid Divider (`#e5e7eb`) for items in a list.
    *   Active/Selected State: Background `#f3f4f6` (Gray-100) - *Assumed*

### Navigation

*   **Bottom Navigation (Telegram Standard):** Adapt to Telegram's provided theme.
    *   Height: ~60px (variable)
    *   Active Icon/Text: Primary (`#2563eb`) or Telegram Link Color
    *   Inactive Icon/Text: Hint (`#6b7280`) or Telegram Hint Color
*   **App Bar (Header):**
    *   Background: Surface (`#ffffff`) or Telegram Header Color
    *   Shadow: `0 1px 3px rgba(0, 0, 0, 0.08)`
    *   Height: ~56px
    *   Title: H3 Typography
*   **Tab Bar (if implemented):**
    *   Selected Tab: Text Primary (`#2563eb`), optional bottom border indicator (Primary color).
    *   Unselected Tab: Text Hint (`#6b7280`)
    *   Font: Label typography

### Icons

*   **Standard Size:** 24px
*   **Small Size:** 20px
*   **Large Size:** 32px
*   **Style:** Outline/Regular weight (consistent library, e.g., Heroicons, Feather)
*   **Primary Action Icons:** Use Primary (`#2563eb`) or On Primary (`#ffffff`) depending on background.
*   **Secondary/Decorative Icons:** Use Hint (`#6b7280`).

### Status Indicators / Badges

*   **General:** Pill shape (Border Radius: 16px or `9999px`), Padding: `4px 10px`.
*   **Success:** Background `#d1fae5` (Green-100), Text `#065f46` (Green-800)
*   **Warning:** Background `#fffbeb` (Amber-100), Text `#92400e` (Amber-800)
*   **Error:** Background `#fee2e2` (Red-100), Text `#991b1b` (Red-800)
*   **Info:** Background `#dbeafe` (Blue-100), Text `#1e40af` (Blue-800)
*   **Default/Neutral:** Background `#e5e7eb` (Gray-200), Text `#374151` (Gray-700)

## Layout Guidelines

*   **Standard Screen Padding:** 16px left and right.
*   **Content Spacing:** 16px between major sections/cards, 8px-12px between related items within a section.
*   **Grid System:** Use multiples of 8px for spacing and sizing where feasible.
*   **Screen Transitions:** Standard platform slide transitions (e.g., right-to-left for forward navigation).
*   **Tap Target Size:** Minimum 44x44 points for all interactive elements.

## Responsive Behavior

*   Mini Apps primarily target phone sizes. Focus on a single-column layout.
*   **Small Phones:** Ensure readability and tap targets remain usable. Maintain 16px padding. Consider slightly reducing font sizes (e.g., Body 1 -> 15px) if needed for density, but prioritize legibility.
*   **Large Phones:** Standard specifications should work well.
*   **Tablets (Less common target):** If needed, increase margins, font sizes, and consider two-column layouts in landscape mode.

## Accessibility (WCAG AA Goals)

*   **Contrast Ratio:** Ensure text has a minimum contrast ratio of 4.5:1 against its background (3:1 for large text - 18pt/24px normal or 14pt/19px bold).
*   **Touch Targets:** Maintain minimum 44x44 points.
*   **Text Scaling:** Use relative units (rem, em) for fonts where possible to allow users to adjust text size in their device settings. Test up to 200% scaling.
*   **Color Use:** Do not rely on color alone to convey information (e.g., use icons or text alongside color for status indicators).
*   **Alternative Text:** Provide descriptive text for images where appropriate (less critical in Mini Apps unless images convey essential info).
*   **Focus Indicators:** Ensure clear focus indicators for interactive elements when navigating via keyboard (less common in Mini Apps, but good practice). 