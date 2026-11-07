"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { CheckCircle2, LockKeyhole } from "lucide-react";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("El enlace de recuperación no es válido.");
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No fue posible cambiar la contraseña.");
      }

      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ocurrió un error."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f7f4] flex items-center justify-center px-5">
      <div className="bg-white w-full max-w-md p-8 md:p-12 shadow-sm">
        <Link href="/" className="block text-center mb-12">
          <span className="text-2xl tracking-[0.35em] font-semibold">
            ATELIER
          </span>
          <span className="block text-[9px] tracking-[0.5em] text-neutral-500 mt-2">
            MENSWEAR
          </span>
        </Link>

        {!success ? (
          <>
            <div className="text-center mb-8">
              <LockKeyhole size={30} className="mx-auto mb-5" />

              <h1 className="text-2xl font-light">
                Nueva contraseña
              </h1>

              <p className="text-sm text-neutral-500 mt-3">
                Crea una contraseña nueva para tu cuenta.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-xs uppercase tracking-widest text-neutral-500">
                  Nueva contraseña
                </label>

                <input
                  type="password"
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input w-full mt-2"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest text-neutral-500">
                  Confirmar contraseña
                </label>

                <input
                  type="password"
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="auth-input w-full mt-2"
                  placeholder="Repite tu contraseña"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !token}
                className="w-full bg-black text-white py-4 text-xs tracking-[0.2em] hover:bg-neutral-800 disabled:opacity-50 transition"
              >
                {loading ? "ACTUALIZANDO..." : "GUARDAR CONTRASEÑA"}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-8">
            <CheckCircle2
              size={48}
              className="mx-auto text-green-600 mb-6"
            />

            <h1 className="text-2xl font-light">
              ¡Contraseña actualizada!
            </h1>

            <p className="text-sm text-neutral-500 mt-4">
              Ya puedes iniciar sesión con tu nueva contraseña.
            </p>

            <button
              onClick={() => router.push("/")}
              className="mt-8 bg-black text-white w-full py-4 text-xs tracking-widest"
            >
              VOLVER A LA TIENDA
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          Cargando...
        </main>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}