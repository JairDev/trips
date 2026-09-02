// Clases compartidas del sistema de diseño (ver DESIGN.md).
// Contenedores en 0px de radio; interactivos en 4px (rounded-sm). Sin sombras.

/** Bloque de contenido: hairline de 1px sobre el lienzo, sin sombra ni radio. */
export const CARD = "border border-hairline bg-canvas p-4";

/** Encabezado de sección: monoespaciada 16/700 con regla hairline debajo. */
export const SECTION_TITLE =
  "border-b border-hairline pb-2 text-base font-bold text-ink";

/** Campo de texto: fondo surface-soft, foco plano (borde tinta, sin halo). */
export const CAMPO =
  "min-h-11 w-full rounded-sm border border-hairline bg-surface-soft px-3 " +
  "text-base text-ink outline-none placeholder:text-ash " +
  "focus:border-ink focus:bg-canvas disabled:opacity-50";

/** Botón primario: relleno tinta, texto crema; activo cae a ink-deep. */
export const BTN_PRIMARY =
  "min-h-11 rounded-sm bg-ink px-5 text-base font-medium text-canvas " +
  "active:bg-ink-deep disabled:bg-surface-card disabled:text-ash";

/** Botón secundario: contorno hairline-strong sobre lienzo. */
export const BTN_SECONDARY =
  "min-h-11 rounded-sm border border-hairline-strong bg-canvas px-4 " +
  "text-base font-medium text-ink active:bg-surface-soft";
