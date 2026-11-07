"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ShoppingBag,
  Trash2,
} from "lucide-react";

import StoreHeader from "@/src/components/store-header";
import AuthModal from "@/src/components/auth-modal";
import { getProductImage } from "@/src/lib/product-images";

interface CartDetail {
  id: number;
  id_producto: number;
  cantidad: number;
  nombre: string;
  precio: number | string;
  stock_actual: number;
  subtotal: number | string;
}

interface Direccion {
  id: number;
  id_cliente: number;
  colonia: string;
  codigo_postal: string;
}

export default function CartPage() {
  const [items, setItems] = useState<CartDetail[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [error, setError] = useState("");
  const [direcciones, setDirecciones] = useState<Direccion[]>([]);
  const [direccionIdSeleccionada, setDireccionIdSeleccionada] = useState<number | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  
  async function loadDirecciones() {
    try {
      const response = await fetch("/api/direcciones", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (response.status === 401) {
        setAuthOpen(true);
        setDirecciones([]);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "No se pudieron cargar las direcciones."
        );
      }

      const lista: Direccion[] = data.direcciones || [];

      setDirecciones(lista);

      if (lista.length > 0) {
        setDireccionIdSeleccionada(Number(lista[0].id));
      } else {
        setDireccionIdSeleccionada(null);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al cargar las direcciones."
      );
    }
  }
  

  async function loadCart() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/carrito", {
        credentials: "include",
        cache: "no-store",
      });

      if (response.status === 401) {
        setAuthOpen(true);
        setItems([]);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo cargar el carrito");
      }

      setItems(data.detalles || []);
      setTotal(Number(data.total || 0));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al cargar el carrito"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCart();
    loadDirecciones();
  }, []);

  const money = (value: number) =>
    value.toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
    });
  
  
  async function finalizarCompra(direccionId: number) {
    if (!direccionId || direccionId <= 0) {
      setError("Selecciona una dirección de entrega.");
      return;
    }

    if (items.length === 0) {
      setError("Tu carrito está vacío.");
      return;
    }

    try {
      setCheckoutLoading(true);
      setError("");

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ direccionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "No fue posible iniciar el pago."
        );
      }

      if (!data.url) {
        throw new Error("No se recibió la URL de pago de Stripe.");
      }

      window.location.assign(data.url);

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al procesar la compra."
      );

      setCheckoutLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#faf9f6]">
      <StoreHeader />

      <div className="mx-auto max-w-[1250px] px-5 py-14 md:px-10 md:py-20">

        <div className="mb-12">
          <span className="text-[10px] uppercase tracking-[0.35em] text-neutral-400">
            Tu selección
          </span>

          <h1 className="mt-4 font-serif text-5xl md:text-6xl">
            Mi carrito
          </h1>

          <p className="mt-4 text-sm text-neutral-500">
            Revisa los productos que has seleccionado.
          </p>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-5">
            <div className="h-28 bg-neutral-200" />
            <div className="h-28 bg-neutral-200" />
          </div>
        ) : error ? (
          <div className="py-20 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={loadCart}
              className="mt-6 border-b border-black pb-2 text-xs uppercase tracking-widest"
            >
              Intentar nuevamente
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center">
            <ShoppingBag
              size={42}
              strokeWidth={1}
              className="mx-auto text-neutral-400"
            />

            <h2 className="mt-7 font-serif text-3xl">
              Tu carrito está vacío
            </h2>

            <p className="mt-3 text-sm text-neutral-400">
              Descubre nuestra colección y encuentra tu próximo traje.
            </p>

            <Link
              href="/"
              className="mt-9 inline-flex items-center gap-4 bg-neutral-950 px-8 py-4 text-[10px] uppercase tracking-[0.2em] text-white transition hover:bg-neutral-700"
            >
              Explorar colección
              <ArrowLeft size={15} />
            </Link>
          </div>
        ) : (
          <div className="grid gap-12 lg:grid-cols-[1fr_360px]">

            {/* PRODUCTOS */}

            <div>
              <div className="hidden grid-cols-[1fr_100px_120px] border-b border-neutral-200 pb-4 text-[9px] uppercase tracking-widest text-neutral-400 sm:grid">
                <span>Producto</span>
                <span className="text-center">Cantidad</span>
                <span className="text-right">Subtotal</span>
              </div>

              <div className="divide-y divide-neutral-200">
                {items.map((item) => (
                  <article
                    key={item.id}
                    className="grid grid-cols-[100px_1fr] gap-5 py-7 sm:grid-cols-[130px_1fr_100px_120px]"
                  >
                    <Link href={`/producto/${item.id_producto}`}>
                      <img
                        src={getProductImage(item.id_producto)}
                        alt={item.nombre}
                        className="aspect-[3/4] w-full bg-neutral-200 object-cover"
                      />
                    </Link>

                    <div className="flex flex-col justify-center">
                      <Link
                        href={`/producto/${item.id_producto}`}
                        className="font-serif text-lg hover:text-neutral-500"
                      >
                        {item.nombre}
                      </Link>

                      <p className="mt-2 text-xs text-neutral-500">
                        {money(Number(item.precio))}
                      </p>

                      <p className="mt-2 text-[10px] text-neutral-400">
                        {Number(item.stock_actual) > 0
                          ? "Disponible"
                          : "Consultar disponibilidad"}
                      </p>
                    </div>

                    <div className="flex items-center justify-start sm:justify-center">
                      <span className="text-sm">
                        {item.cantidad}
                      </span>
                    </div>

                    <div className="flex items-center justify-start text-sm font-medium sm:justify-end">
                      {money(Number(item.subtotal))}
                    </div>
                  </article>
                ))}
              </div>

              <Link
                href="/"
                className="mt-7 inline-flex items-center gap-3 text-[10px] uppercase tracking-widest text-neutral-500 hover:text-black"
              >
                <ArrowLeft size={15} />
                Seguir comprando
              </Link>
            </div>

            {/* RESUMEN */}

            <aside className="h-fit border border-neutral-200 p-7">
              <h2 className="font-serif text-2xl">
                Resumen del pedido
              </h2>

              <div className="mt-8 space-y-5 border-b border-neutral-200 pb-6">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">
                    Productos ({items.length})
                  </span>
                  <span>{money(total)}</span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">
                    Envío
                  </span>
                  <span className="text-neutral-400">
                    Por calcular
                  </span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest">
                  Total
                </span>

                <span className="text-xl font-medium">
                  {money(total)}
                </span>
              </div>

              <p className="mt-4 text-[10px] leading-5 text-neutral-400">
                El envío y el importe final se confirmarán durante
                el proceso de compra.
              </p>

              <div className="mt-7">
                <label className="mb-3 block text-[10px] uppercase tracking-widest text-neutral-500">
                  Dirección de entrega
                </label>

                {direcciones.length > 0 ? (
                  <select
                    value={direccionIdSeleccionada ?? ""}
                    onChange={(e) =>
                      setDireccionIdSeleccionada(Number(e.target.value))
                    }
                    className="w-full border border-neutral-300 bg-transparent px-4 py-3 text-xs outline-none focus:border-black"
                  >
                    {direcciones.map((direccion) => (
                      <option key={direccion.id} value={direccion.id}>
                        {direccion.colonia} - C.P. {direccion.codigo_postal}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="border border-neutral-200 p-4">
                    <p className="text-xs text-neutral-500">
                      No tienes direcciones registradas.
                    </p>

                    <Link
                      href="/direcciones"
                      className="mt-3 inline-block text-xs underline"
                    >
                      Agregar una dirección
                    </Link>
                  </div>
                )}
              </div>
              {error && (
                <p className="mt-4 text-xs text-red-600">
                  {error}
                </p>
              )}
              <button
                onClick={() => {
                  if (direccionIdSeleccionada !== null) {
                    finalizarCompra(direccionIdSeleccionada);
                  } else {
                    setError("Selecciona una dirección de entrega.");
                  }
                }}
                disabled={
                  checkoutLoading ||
                  items.length === 0 ||
                  direcciones.length === 0 ||
                  direccionIdSeleccionada === null
                }
                className="mt-8 w-full bg-neutral-950 py-4 text-[10px] uppercase tracking-[0.2em] text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
              >
                {checkoutLoading
                  ? "Procesando compra..."
                  : "Finalizar compra"}
              </button>
            </aside>
          </div>
        )}
      </div>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => {
          setAuthOpen(false);
          loadCart();
        }}
      />
    </main>
  );
}