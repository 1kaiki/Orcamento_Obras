import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const token = (nome: string) => `hsl(var(--${nome}) / <alpha-value>)`;

/**
 * Tema FECHADO: `colors`, `fontSize`, `borderRadius` e `boxShadow` substituem os padrões do Tailwind.
 * Uma classe como `bg-red-500` nem existe aqui; toda cor vem das variáveis de src/styles/globals.css.
 */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      background: token("background"),
      foreground: token("foreground"),
      card: { DEFAULT: token("card"), foreground: token("card-foreground") },
      popover: { DEFAULT: token("popover"), foreground: token("popover-foreground") },
      muted: { DEFAULT: token("muted"), foreground: token("muted-foreground") },
      border: token("border"),
      input: token("input"),
      ring: token("ring"),
      scrim: token("scrim"),
      primary: { DEFAULT: token("primary"), foreground: token("primary-foreground"), edge: token("primary-edge") },
      secondary: { DEFAULT: token("secondary"), foreground: token("secondary-foreground") },
      panel: {
        DEFAULT: token("panel"),
        foreground: token("panel-foreground"),
        muted: token("panel-muted"),
        border: token("panel-border"),
      },
      success: { DEFAULT: token("success"), soft: token("success-soft") },
      warning: { DEFAULT: token("warning"), soft: token("warning-soft") },
      danger: { DEFAULT: token("danger"), soft: token("danger-soft"), foreground: token("danger-foreground") },
      tape: { DEFAULT: token("tape"), ink: token("tape-ink"), band: token("tape-band"), "band-ink": token("tape-band-ink") },
      barra: { custo: token("barra-custo"), imposto: token("barra-imposto"), lucro: token("barra-lucro") },
    },
    fontFamily: {
      display: ['"Big Shoulders Display Variable"', '"Arial Narrow"', "sans-serif"],
      sans: ['"Public Sans Variable"', "system-ui", "-apple-system", '"Segoe UI"', "Roboto", "sans-serif"],
    },
    // Escala de tipos (razão ≈ 1,25). Display = títulos e valores; o resto = texto.
    fontSize: {
      caption: ["0.8125rem", { lineHeight: "1.35" }],
      label: ["0.9375rem", { lineHeight: "1.35" }],
      body: ["1rem", { lineHeight: "1.5" }],
      "body-lg": ["1.125rem", { lineHeight: "1.45" }],
      "display-sm": ["1.5rem", { lineHeight: "1.1" }],
      "display-md": ["1.875rem", { lineHeight: "1.05" }],
      "display-lg": ["2.375rem", { lineHeight: "1" }],
      "display-xl": ["3rem", { lineHeight: "1" }],
      // Os dois maiores acompanham a largura da tela para o valor caber numa linha em qualquer celular.
      "display-2xl": ["min(3.75rem, 15vw)", { lineHeight: "1" }],
      "display-hero": ["min(4.5rem, 18vw)", { lineHeight: "1" }],
    },
    borderRadius: {
      none: "0",
      sm: "var(--radius-sm)",
      md: "var(--radius-md)",
      lg: "var(--radius-lg)",
      xl: "var(--radius-xl)",
      full: "9999px",
    },
    boxShadow: {
      none: "none",
      card: "var(--shadow-card)",
      raised: "var(--shadow-raised)",
      press: "var(--shadow-press)",
    },
    extend: {
      spacing: {
        gutter: "var(--space-gutter)",
        section: "var(--space-section)",
        touch: "var(--size-touch)",
        field: "var(--size-field)",
        cta: "var(--size-cta)",
        bar: "var(--size-bar)",
        "bar-lg": "var(--size-bar-lg)",
        safe: "env(safe-area-inset-bottom, 0px)",
        "safe-top": "env(safe-area-inset-top, 0px)",
      },
      maxWidth: { content: "var(--size-content)" },
      transitionDuration: { fast: "150ms", base: "200ms", slow: "250ms" },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down 200ms ease-out",
        "accordion-up": "accordion-up 200ms ease-out",
      },
    },
  },
  plugins: [animate],
} satisfies Config;
