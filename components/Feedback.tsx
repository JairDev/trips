"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Modal from "@/components/Modal";

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
