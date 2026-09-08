"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

// -----------------------------------------------------------------------------
//  Shell de modal: backdrop atenuado (sin sombra, estilo terminal), panel con
//  borde de tinta. Escape o click fuera cierra.
// -----------------------------------------------------------------------------
function Modal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-ink/40"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-sm border border-ink bg-canvas p-5"
      >
        {children}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
//  Contexto: confirmar() (modal con promesa) + toast() (aviso efímero abajo).
// -----------------------------------------------------------------------------
interface ConfirmOpts {
  titulo: string;
  mensaje?: ReactNode;
  textoConfirmar?: string;
  textoCancelar?: string;
  peligroso?: boolean;
}

type Tono = "error" | "ok";
type ConfirmState = ConfirmOpts & { resolver: (v: boolean) => void };
interface ToastItem {
  id: number;
  texto: string;
  tono: Tono;
}

interface FeedbackCtx {
  confirmar: (opts: ConfirmOpts) => Promise<boolean>;
  toast: (texto: string, tono?: Tono) => void;
}

const Ctx = createContext<FeedbackCtx | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const confirmar = useCallback(
    (opts: ConfirmOpts) =>
      new Promise<boolean>((resolver) => {
        setConfirmState({ ...opts, resolver });
      }),
    [],
  );

  const cerrarConfirm = useCallback((valor: boolean) => {
    setConfirmState((s) => {
      s?.resolver(valor);
      return null;
    });
  }, []);

  const toast = useCallback((texto: string, tono: Tono = "error") => {
    const id = (idRef.current += 1);
    setToasts((t) => [...t, { id, texto, tono }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 4500);
  }, []);

  return (
    <Ctx.Provider value={{ confirmar, toast }}>
      {children}

      {confirmState && (
        <Modal onClose={() => cerrarConfirm(false)}>
          <p className="text-base font-bold text-ink">{confirmState.titulo}</p>
          {confirmState.mensaje != null && (
            <div className="mt-2 text-sm leading-relaxed text-body">
              {confirmState.mensaje}
            </div>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => cerrarConfirm(false)}
              className="min-h-11 rounded-sm px-4 text-sm font-medium text-mute active:text-ink"
            >
              {confirmState.textoCancelar ?? "Cancelar"}
            </button>
            <button
              type="button"
              autoFocus
              onClick={() => cerrarConfirm(true)}
              className={`min-h-11 rounded-sm px-4 text-sm font-medium text-canvas ${
                confirmState.peligroso
                  ? "bg-danger-hover active:bg-danger"
                  : "bg-ink active:bg-ink-deep"
              }`}
            >
              {confirmState.textoConfirmar ?? "Confirmar"}
            </button>
          </div>
        </Modal>
      )}

      {toasts.length > 0 && (
        <div
          className="fixed inset-x-0 bottom-4 z-[120] flex flex-col items-center gap-2 px-4"
          style={{ marginBottom: "env(safe-area-inset-bottom)" }}
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              role="status"
              className={`max-w-sm border bg-canvas px-4 py-2.5 text-sm ${
                t.tono === "error"
                  ? "border-danger-hover text-danger-hover"
                  : "border-hairline-strong text-ink"
              }`}
            >
              {t.tono === "error" ? "[x] " : "[✓] "}
              {t.texto}
            </div>
          ))}
        </div>
      )}
    </Ctx.Provider>
  );
}

export function useFeedback(): FeedbackCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFeedback debe usarse dentro de <FeedbackProvider>");
  return ctx;
}
