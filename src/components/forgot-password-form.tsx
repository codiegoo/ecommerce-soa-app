"use client";

import { useState } from "react";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";

interface Props {
  onBack: () => void;
}

export default function ForgotPasswordForm({ onBack }: Props) {
  const [correo, setCorreo] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ correo }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ocurrió un error.");
      }

      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo enviar la solicitud."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-neutral-500 hover:text-black mb-8"
      >
        <ArrowLeft size={16} />
        Volver al inicio de sesión
      </button>

      {!success ? (
        <>
          <div className="mb-8">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-5">
              <Mail size={22} />
            </div>

            <h2 className="text-2xl font-light tracking-wide">
              ¿Olvidaste tu contraseña?
            </h2>

            <p className="text-sm text-neutral-500 mt-3 leading-6">
              No te preocupes. Introduce tu correo electrónico y te enviaremos
              un enlace para crear una nueva contraseña.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs uppercase tracking-widest text-neutral-500">
                Correo electrónico
              </label>

              <input
                type="email"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="auth-input w-full mt-2"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-4 text-xs tracking-[0.2em] hover:bg-neutral-800 disabled:opacity-50 transition"
            >
              {loading ? "ENVIANDO..." : "ENVIAR ENLACE"}
            </button>
          </form>
        </>
      ) : (
        <div className="text-center py-8">
          <CheckCircle2
            size={48}
            className="mx-auto mb-5 text-green-600"
          />

          <h2 className="text-2xl font-light">
            Revisa tu correo
          </h2>

          <p className="text-sm text-neutral-500 mt-4 leading-6">
            Si el correo está registrado, recibirás un enlace para
            restablecer tu contraseña.
          </p>

          <button
            onClick={onBack}
            className="mt-8 text-xs tracking-widest border-b border-black pb-1"
          >
            VOLVER AL INICIO DE SESIÓN
          </button>
        </div>
      )}
    </div>
  );
}