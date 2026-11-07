
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Plus, Trash2 } from "lucide-react";

import StoreHeader from "@/src/components/store-header";
import AuthModal from "@/src/components/auth-modal";

interface Direccion {
  id: number;
  id_cliente: number;
  colonia: string;
  codigo_postal: string;
}

export default function DireccionesPage() {
  const [direcciones, setDirecciones] = useState<Direccion[]>([]);
  const [colonia, setColonia] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const cargarDirecciones = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/direcciones", {
        method: "GET",
        credentials: "include",
      });

      if (response.status === 401) {
        setAuthOpen(true);
        setDirecciones([]);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudieron cargar las direcciones");
      }

      setDirecciones(data.direcciones || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al cargar las direcciones"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDirecciones();
  }, [cargarDirecciones]);

  const registrarDireccion = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setMensaje("");

    const coloniaLimpia = colonia.trim();
    const codigoLimpio = codigoPostal.trim();

    if (!coloniaLimpia || !codigoLimpio) {
      setError("Completa todos los campos.");
      return;
    }

    if (!/^\d{5}$/.test(codigoLimpio)) {
      setError("El código postal debe contener exactamente 5 números.");
      return;
    }

    try {
      setGuardando(true);

      const response = await fetch("/api/direcciones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          colonia: coloniaLimpia,
          codigoPostal: codigoLimpio,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        setAuthOpen(true);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "No se pudo registrar la dirección");
      }

      setMensaje("Tu dirección se registró correctamente.");
      setColonia("");
      setCodigoPostal("");

      await cargarDirecciones();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al registrar la dirección"
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#faf9f6] text-[#25231f]">
      <StoreHeader />

      <section className="mx-auto max-w-5xl px-6 py-12 md:px-10">
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-2 text-sm text-neutral-500 transition hover:text-black"
        >
          <ArrowLeft size={16} />
          Volver a la tienda
        </Link>

        <div className="mb-12">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-[#a18a68]">
            Mi cuenta
          </p>

          <h1 className="font-serif text-4xl md:text-5xl">
            Mis direcciones
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-7 text-neutral-500">
            Administra tus direcciones para facilitar tus próximas compras.
          </p>
        </div>

        <div className="grid gap-12 md:grid-cols-[1fr_1.1fr]">
          <section className="border border-[#e8e4dc] bg-white p-6 md:p-8">
            <div className="mb-7 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center bg-[#f5f2ec]">
                <Plus size={19} />
              </div>

              <div>
                <h2 className="font-serif text-2xl">
                  Agregar dirección
                </h2>
                <p className="mt-1 text-xs text-neutral-400">
                  Registra una nueva ubicación
                </p>
              </div>
            </div>

            <form onSubmit={registrarDireccion} className="space-y-6">
              <div>
                <label
                  htmlFor="colonia"
                  className="mb-2 block text-xs font-medium uppercase tracking-wider text-neutral-600"
                >
                  Colonia
                </label>

                <input
                  id="colonia"
                  type="text"
                  value={colonia}
                  onChange={(e) => setColonia(e.target.value)}
                  placeholder="Ej. Centro"
                  maxLength={150}
                  className="w-full border border-[#e5e1d9] bg-[#faf9f6] px-4 py-3 text-sm outline-none transition focus:border-[#a18a68]"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="codigoPostal"
                  className="mb-2 block text-xs font-medium uppercase tracking-wider text-neutral-600"
                >
                  Código postal
                </label>

                <input
                  id="codigoPostal"
                  type="text"
                  inputMode="numeric"
                  value={codigoPostal}
                  onChange={(e) =>
                    setCodigoPostal(e.target.value.replace(/\D/g, "").slice(0, 5))
                  }
                  placeholder="Ej. 06000"
                  maxLength={5}
                  className="w-full border border-[#e5e1d9] bg-[#faf9f6] px-4 py-3 text-sm outline-none transition focus:border-[#a18a68]"
                  required
                />
              </div>

              {error && (
                <p
                  role="alert"
                  className="border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  {error}
                </p>
              )}

              {mensaje && (
                <p
                  role="status"
                  className="border border-green-200 bg-green-50 p-3 text-sm text-green-700"
                >
                  {mensaje}
                </p>
              )}

              <button
                type="submit"
                disabled={guardando}
                className="flex w-full items-center justify-center gap-2 bg-[#25231f] px-5 py-4 text-xs uppercase tracking-[0.2em] text-white transition hover:bg-[#49443b] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={16} />
                {guardando ? "Guardando..." : "Guardar dirección"}
              </button>
            </form>
          </section>

          <section>
            <div className="mb-7 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl">
                  Direcciones guardadas
                </h2>
                <p className="mt-1 text-xs text-neutral-400">
                  Tus ubicaciones registradas
                </p>
              </div>

              <span className="text-sm text-neutral-400">
                {direcciones.length}{" "}
                {direcciones.length === 1 ? "dirección" : "direcciones"}
              </span>
            </div>

            {loading ? (
              <div className="border border-[#e8e4dc] bg-white p-8 text-center text-sm text-neutral-400">
                Cargando direcciones...
              </div>
            ) : direcciones.length === 0 ? (
              <div className="border border-[#e8e4dc] bg-white px-6 py-12 text-center">
                <MapPin
                  size={30}
                  className="mx-auto mb-4 text-[#b5a58b]"
                />

                <h3 className="font-serif text-xl">
                  Aún no tienes direcciones
                </h3>

                <p className="mt-2 text-sm text-neutral-400">
                  Agrega tu primera dirección utilizando el formulario.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {direcciones.map((direccion) => (
                  <article
                    key={direccion.id}
                    className="flex items-start gap-4 border border-[#e8e4dc] bg-white p-6"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#f5f2ec]">
                      <MapPin size={19} className="text-[#a18a68]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-serif text-lg">
                        {direccion.colonia}
                      </h3>

                      <p className="mt-2 text-sm text-neutral-500">
                        Código postal: {direccion.codigo_postal}
                      </p>

                      <span className="mt-3 inline-block text-[10px] uppercase tracking-[0.2em] text-[#a18a68]">
                        Dirección registrada
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => {
          setAuthOpen(false);
          cargarDirecciones();
        }}
      />
    </main>
  );
}
