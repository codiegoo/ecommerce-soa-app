"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Minus,
  Plus,
  ShoppingBag,
  ShieldCheck,
  Truck,
  RefreshCw,
  Heart,
} from "lucide-react";

import StoreHeader from "@/src/components/store-header";
import AuthModal from "@/src/components/auth-modal";
import { getProductImage } from "@/src/lib/product-images";

interface Product {
  id: number;
  nombre: string;
  precio: number | string;
  stock_actual: number;
  proveedor?: string;
}

export default async function ProductDetailPage({
  params,
}:{
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  const [authOpen, setAuthOpen] = useState(false);
  const [pendingAdd, setPendingAdd] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Obtener producto desde Neon mediante la API

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/productos/${id}`, {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "No se encontró el producto"
          );
        }

        setProduct(data.producto);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Error al cargar el producto"
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadProduct();
    }
  }, [id]);

  // Formato de precio

  const formatPrice = (price: number | string) => {
    return Number(price).toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
    });
  };

  // Agregar al carrito

  async function addToCart() {
    if (!product) return;

    try {
      const sessionResponse = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });

      if (!sessionResponse.ok) {
        setPendingAdd(true);
        setAuthOpen(true);
        return;
      }

      await saveProductToCart();
    } catch {
      setPendingAdd(true);
      setAuthOpen(true);
    }
  }

  async function saveProductToCart() {
    if (!product) return;

    try {
      const response = await fetch("/api/carrito/agregar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          idProducto: product.id,
          cantidad: quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "No se pudo agregar el producto"
        );
      }

      setMessage("Producto agregado correctamente");

      window.dispatchEvent(new Event("cart-updated"));

      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Ocurrió un error"
      );

      setTimeout(() => setMessage(""), 3000);
    }
  }

  // Después del inicio de sesión o registro

  async function handleAuthSuccess() {
    setAuthOpen(false);

    if (pendingAdd) {
      setPendingAdd(false);
      await saveProductToCart();
    }
  }

  // Pantalla de carga

  if (loading) {
    return (
      <main className="min-h-screen bg-[#faf9f6]">
        <StoreHeader />

        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid animate-pulse gap-12 md:grid-cols-2">

            <div className="aspect-[3/4] bg-neutral-200" />

            <div className="space-y-7 py-10">
              <div className="h-4 w-32 bg-neutral-200" />
              <div className="h-12 w-3/4 bg-neutral-200" />
              <div className="h-7 w-1/3 bg-neutral-200" />
              <div className="h-24 bg-neutral-200" />
              <div className="h-14 bg-neutral-200" />
            </div>

          </div>
        </div>
      </main>
    );
  }

  // Producto no encontrado

  if (!product || error) {
    return (
      <main className="min-h-screen bg-[#faf9f6]">
        <StoreHeader />

        <div className="flex min-h-[65vh] flex-col items-center justify-center px-6 text-center">

          <ShoppingBag
            size={45}
            strokeWidth={1}
            className="text-neutral-400"
          />

          <h1 className="mt-7 font-serif text-4xl">
            Producto no encontrado
          </h1>

          <p className="mt-4 text-sm text-neutral-500">
            {error || "No encontramos el traje que buscas."}
          </p>

          <Link
            href="/"
            className="mt-9 inline-flex items-center gap-3 bg-neutral-950 px-8 py-4 text-xs uppercase tracking-widest text-white transition hover:bg-neutral-700"
          >
            <ArrowLeft size={16} />
            Volver a la tienda
          </Link>

        </div>
      </main>
    );
  }

  const stock = Number(product.stock_actual);
  const available = stock > 0;

  return (
    <main className="min-h-screen bg-[#faf9f6]">

      <StoreHeader />

      {/* BREADCRUMB */}

      <div className="mx-auto max-w-[1400px] px-5 pt-8 md:px-10">

        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-neutral-400">

          <Link href="/" className="hover:text-black">
            Inicio
          </Link>

          <ChevronRight size={12} />

          <Link href="/#coleccion" className="hover:text-black">
            Colección
          </Link>

          <ChevronRight size={12} />

          <span className="truncate text-neutral-800">
            {product.nombre}
          </span>

        </div>

      </div>

      {/* PRODUCTO */}

      <section className="mx-auto max-w-[1400px] px-5 py-10 md:px-10 md:py-16">

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-20">

          {/* GALERÍA */}

          <div className="relative">

            <div className="group relative overflow-hidden bg-[#eeece7]">

              <img
                src={getProductImage(product.id)}
                alt={product.nombre}
                className="aspect-[4/5] w-full object-cover transition duration-700 group-hover:scale-[1.03]"
              />

              <div className="absolute left-5 top-5 bg-[#faf9f6] px-4 py-2">
                <span className="text-[9px] uppercase tracking-[0.2em]">
                  Colección ATELIER
                </span>
              </div>

              <button
                type="button"
                aria-label="Favoritos"
                className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-[#faf9f6] text-neutral-700 transition hover:bg-neutral-950 hover:text-white"
              >
                <Heart size={18} strokeWidth={1.5} />
              </button>

            </div>

            <p className="mt-4 text-center text-[9px] uppercase tracking-[0.25em] text-neutral-400">
              Elegancia en cada detalle
            </p>

          </div>

          {/* INFORMACIÓN */}

          <div className="flex flex-col justify-center py-3 lg:py-10">

            <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-400">
              Sastrería contemporánea
            </span>

            <h1 className="mt-5 font-serif text-4xl leading-tight text-neutral-950 md:text-6xl">
              {product.nombre}
            </h1>

            <div className="mt-7 flex items-center justify-between">

              <p className="text-2xl font-light tracking-wide text-neutral-950">
                {formatPrice(product.precio)}
              </p>

              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    available ? "bg-green-600" : "bg-red-500"
                  }`}
                />

                <span className="text-[10px] uppercase tracking-widest text-neutral-500">
                  {available ? "Disponible" : "Agotado"}
                </span>
              </div>

            </div>

            <div className="my-9 border-y border-neutral-200 py-8">

              <h2 className="font-serif text-xl">
                Descripción
              </h2>

              <p className="mt-4 text-sm leading-8 text-neutral-500">
                Una prenda diseñada para quienes buscan proyectar
                elegancia, seguridad y sofisticación. Una elección
                ideal para eventos formales, reuniones y ocasiones
                especiales.
              </p>

              <p className="mt-4 text-[10px] uppercase tracking-widest text-neutral-400">
                Diseño · Estilo · Distinción
              </p>

            </div>

            {/* CANTIDAD */}

            <div className="mb-8 flex items-center justify-between">

              <span className="text-[10px] uppercase tracking-[0.2em]">
                Cantidad
              </span>

              <div className="flex items-center border border-neutral-300">

                <button
                  type="button"
                  onClick={() =>
                    setQuantity((current) => Math.max(1, current - 1))
                  }
                  disabled={quantity <= 1}
                  aria-label="Disminuir cantidad"
                  className="px-4 py-3 text-neutral-600 transition hover:text-black disabled:opacity-30"
                >
                  <Minus size={14} />
                </button>

                <span className="min-w-10 text-center text-sm">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setQuantity((current) =>
                      Math.min(stock, current + 1)
                    )
                  }
                  disabled={!available || quantity >= stock}
                  aria-label="Aumentar cantidad"
                  className="px-4 py-3 text-neutral-600 transition hover:text-black disabled:opacity-30"
                >
                  <Plus size={14} />
                </button>

              </div>

            </div>

            {/* BOTÓN DE COMPRA */}

            <button
              type="button"
              onClick={addToCart}
              disabled={!available}
              className="flex w-full items-center justify-center gap-4 bg-neutral-950 py-5 text-[10px] uppercase tracking-[0.25em] text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              <ShoppingBag size={17} strokeWidth={1.5} />

              {available
                ? "Agregar al carrito"
                : "Producto agotado"}

              {available && <ArrowRight size={16} />}
            </button>

            <p className="mt-4 text-center text-[10px] leading-5 text-neutral-400">
              Para continuar con tu compra necesitas iniciar sesión
              o crear una cuenta.
            </p>

            {/* BENEFICIOS */}

            <div className="mt-10 space-y-6 border-t border-neutral-200 pt-8">

              <div className="flex items-center gap-4">

                <Truck
                  size={20}
                  strokeWidth={1.3}
                  className="text-neutral-700"
                />

                <div>
                  <p className="text-xs font-medium">
                    Envíos seguros
                  </p>

                  <p className="mt-1 text-[10px] text-neutral-400">
                    Seguimiento de tu pedido.
                  </p>
                </div>

              </div>

              <div className="flex items-center gap-4">

                <ShieldCheck
                  size={20}
                  strokeWidth={1.3}
                  className="text-neutral-700"
                />

                <div>
                  <p className="text-xs font-medium">
                    Compra protegida
                  </p>

                  <p className="mt-1 text-[10px] text-neutral-400">
                    Protegemos tus datos y transacciones.
                  </p>
                </div>

              </div>

              <div className="flex items-center gap-4">

                <RefreshCw
                  size={20}
                  strokeWidth={1.3}
                  className="text-neutral-700"
                />

                <div>
                  <p className="text-xs font-medium">
                    Atención personalizada
                  </p>

                  <p className="mt-1 text-[10px] text-neutral-400">
                    Estamos para ayudarte con tu compra.
                  </p>
                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* PIE DE PÁGINA */}

      <footer className="border-t border-neutral-200 px-6 py-10 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-neutral-500 transition hover:text-black"
        >
          <ArrowLeft size={15} />
          Regresar a la colección
        </Link>
      </footer>

      {/* MENSAJE */}

      {message && (
        <div className="fixed bottom-6 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-3 whitespace-nowrap bg-neutral-950 px-6 py-4 text-xs text-white shadow-xl">
          <Check size={16} />
          {message}
        </div>
      )}

      {/* MODAL DE AUTENTICACIÓN */}

      <AuthModal
        open={authOpen}
        onClose={() => {
          setAuthOpen(false);
          setPendingAdd(false);
        }}
        onSuccess={handleAuthSuccess}
      />

    </main>
  );
}