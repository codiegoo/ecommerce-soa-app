
"use client";

import { useState } from "react";
import {
  X,
  Eye,
  EyeOff,
  LockKeyhole,
} from "lucide-react";

import ForgotPasswordForm from "./forgot-password-form";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({
  open,
  onClose,
  onSuccess,
}: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    password: "",
    direccion: "",
    rfc: "",
  });

  if (!open) return null;

  function change(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint =
        mode === "login"
          ? "/api/auth/login"
          : "/api/auth/register";

      const payload =
        mode === "login"
          ? {
              correo: form.correo,
              password: form.password,
            }
          : form;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "No fue posible completar la operación"
        );
      }

      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error inesperado"
      );
    } finally {
      setLoading(false);
    }
  }

  function closeModal() {
    setShowForgotPassword(false);
    setMode("login");
    setError("");
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto bg-[#faf9f6] p-7 shadow-2xl sm:p-10">

        <button
          onClick={closeModal}
          className="absolute right-5 top-5 text-neutral-500 hover:text-black"
          aria-label="Cerrar"
        >
          <X size={21} />
        </button>

        {showForgotPassword ? (
          <ForgotPasswordForm
            onBack={() => {
              setShowForgotPassword(false);
              setError("");
            }}
          />
        ) : (
          <>
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-neutral-300">
                <LockKeyhole size={20} strokeWidth={1.4} />
              </div>

              <h2 className="font-serif text-3xl text-neutral-950">
                {mode === "login" ? "Bienvenido" : "Crear cuenta"}
              </h2>

              <p className="mt-2 text-xs tracking-wide text-neutral-500">
                {mode === "login"
                  ? "Inicia sesión para continuar con tu compra."
                  : "Únete a nuestra experiencia de sastrería."}
              </p>
            </div>

            <div className="mb-7 grid grid-cols-2 border-b border-neutral-200">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                className={`pb-3 text-xs uppercase tracking-widest ${
                  mode === "login"
                    ? "border-b-2 border-black font-semibold text-black"
                    : "text-neutral-400"
                }`}
              >
                Iniciar sesión
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
                className={`pb-3 text-xs uppercase tracking-widest ${
                  mode === "register"
                    ? "border-b-2 border-black font-semibold text-black"
                    : "text-neutral-400"
                }`}
              >
                Registrarme
              </button>
            </div>

            <form onSubmit={submit} className="space-y-4">

              {mode === "register" && (
                <>
                  <input
                    name="nombre"
                    value={form.nombre}
                    onChange={change}
                    placeholder="Nombre completo"
                    required
                    className="auth-input"
                  />

                  <input
                    name="telefono"
                    value={form.telefono}
                    onChange={change}
                    placeholder="Teléfono"
                    required
                    className="auth-input"
                  />

                  <input
                    name="direccion"
                    value={form.direccion}
                    onChange={change}
                    placeholder="Dirección"
                    required
                    className="auth-input"
                  />

                  <input
                    name="rfc"
                    value={form.rfc}
                    onChange={change}
                    placeholder="RFC"
                    required
                    className="auth-input"
                  />
                </>
              )}

              <input
                type="email"
                name="correo"
                value={form.correo}
                onChange={change}
                placeholder="Correo electrónico"
                required
                className="auth-input"
              />

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={change}
                  placeholder="Contraseña"
                  required
                  minLength={8}
                  className="auth-input pr-12"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400"
                  aria-label={
                    showPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              {mode === "login" && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setError("");
                    }}
                    className="text-xs text-neutral-500 transition hover:text-black"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              )}

              {error && (
                <p className="bg-red-50 p-3 text-xs text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-3 w-full bg-neutral-950 py-4 text-xs uppercase tracking-[0.2em] text-white transition hover:bg-neutral-700 disabled:opacity-50"
              >
                {loading
                  ? "Procesando..."
                  : mode === "login"
                    ? "Iniciar sesión"
                    : "Crear mi cuenta"}
              </button>
            </form>

            <p className="mt-6 text-center text-[10px] leading-5 text-neutral-400">
              Al continuar aceptas nuestros términos y condiciones
              y nuestra política de privacidad.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
