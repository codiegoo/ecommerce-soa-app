"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Search,
  SlidersHorizontal,
  ShieldCheck,
  Truck,
  Scissors,
} from "lucide-react";

import StoreHeader from "@/src/components/store-header";
import ProductCard, {
  Product,
} from "@/src/components/product-card";
import AuthModal from "@/src/components/auth-modal";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  async function loadProducts() {
    try {
      const response = await fetch("/api/productos", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("No se pudieron cargar los productos");
      }

      const data = await response.json();
      setProducts(data.productos || []);
    } catch (error) {
      console.error(error);
      setMessage("No fue posible cargar la colección.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();

    const params = new URLSearchParams(window.location.search);
    setSearch(params.get("q") || "");

    const searchHandler = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      setSearch(customEvent.detail || "");
    };

    window.addEventListener("store-search", searchHandler);

    return () => {
      window.removeEventListener("store-search", searchHandler);
    };
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.nombre
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesAvailability =
        !availableOnly || Number(product.stock_actual) > 0;

      return matchesSearch && matchesAvailability;
    });
  }, [products, search, availableOnly]);

  async function addProduct(id: number) {
    try {
      const sessionResponse = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });

      if (!sessionResponse.ok) {
        setPendingProduct(id);
        setAuthOpen(true);
        return;
      }

      await addProductToCart(id);
    } catch {
      setPendingProduct(id);
      setAuthOpen(true);
    }
  }

  async function addProductToCart(id: number) {
    const response = await fetch("/api/carrito/agregar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        idProducto: id,
        cantidad: 1,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "No se pudo agregar el producto");
      return;
    }

    setMessage("Producto agregado a tu carrito");
    window.dispatchEvent(new Event("cart-updated"));

    setTimeout(() => setMessage(""), 3000);
  }

  async function handleAuthSuccess() {
    setAuthOpen(false);

    if (pendingProduct !== null) {
      await addProductToCart(pendingProduct);
      setPendingProduct(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#faf9f6]">
      <StoreHeader />

      {/* HERO */}

      <section className="relative min-h-[620px] overflow-hidden bg-[#242421] md:min-h-[720px]">

        <img
          src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=2000&q=90"
          alt="Colección de sastrería masculina"
          className="absolute inset-0 h-full w-full object-cover object-center opacity-45"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

        <div className="relative mx-auto flex min-h-[620px] max-w-[1500px] items-center px-6 md:min-h-[720px] md:px-16">
          <div className="max-w-2xl text-white">

            <span className="mb-6 block text-[10px] uppercase tracking-[0.45em] text-neutral-300">
              Sastrería contemporánea
            </span>

            <h1 className="font-serif text-5xl leading-[1.08] tracking-tight sm:text-6xl md:text-8xl">
              El arte de
              <br />
              vestir bien.
            </h1>

            <p className="mt-7 max-w-md text-sm leading-7 text-neutral-300 md:text-base">
              Diseños que combinan elegancia, carácter y
              sofisticación. Descubre nuestra colección de
              prendas para cada ocasión.
            </p>

            <Link
              href="#coleccion"
              className="mt-10 inline-flex items-center gap-5 border border-white px-7 py-4 text-[10px] uppercase tracking-[0.2em] transition hover:bg-white hover:text-black"
            >
              Explorar colección
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="absolute bottom-8 right-8 hidden text-right text-[9px] uppercase tracking-[0.3em] text-white/70 md:block">
          Elegancia sin esfuerzo
          <br />
          Desde 2026
        </div>
      </section>

      {/* BENEFICIOS */}

      <section className="border-b border-neutral-200">
        <div className="mx-auto grid max-w-[1300px] grid-cols-1 divide-y divide-neutral-200 px-6 sm:grid-cols-3 sm:divide-x sm:divide-y-0 md:px-10">

          <div className="flex items-center justify-center gap-4 py-7">
            <Scissors size={21} strokeWidth={1.3} />
            <div>
              <p className="text-[10px] uppercase tracking-widest">
                Diseño elegante
              </p>
              <p className="mt-1 text-xs text-neutral-400">
                Estilo para cada ocasión
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 py-7">
            <Truck size={21} strokeWidth={1.3} />
            <div>
              <p className="text-[10px] uppercase tracking-widest">
                Envíos seguros
              </p>
              <p className="mt-1 text-xs text-neutral-400">
                Seguimiento de tus pedidos
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 py-7">
            <ShieldCheck size={21} strokeWidth={1.3} />
            <div>
              <p className="text-[10px] uppercase tracking-widest">
                Compra protegida
              </p>
              <p className="mt-1 text-xs text-neutral-400">
                Atención personalizada
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* CATÁLOGO */}

      <section
        id="coleccion"
        className="mx-auto max-w-[1500px] px-5 py-20 md:px-10 md:py-28"
      >
        <div className="mb-12 flex flex-col justify-between gap-7 md:flex-row md:items-end">

          <div>
            <span className="text-[10px] uppercase tracking-[0.35em] text-neutral-400">
              Selección exclusiva
            </span>

            <h2 className="mt-4 font-serif text-4xl text-neutral-950 md:text-6xl">
              Nuestra colección
            </h2>

            <p className="mt-4 max-w-lg text-sm leading-6 text-neutral-500">
              Encuentra prendas diseñadas para destacar con
              elegancia y personalidad.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex items-center border-b border-neutral-300 px-2 py-2">
              <Search size={17} className="text-neutral-400" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar un traje..."
                className="w-full bg-transparent px-3 text-xs outline-none sm:w-52"
              />
            </div>

            <button
              onClick={() => setAvailableOnly(!availableOnly)}
              className={`flex items-center justify-center gap-2 border px-4 py-3 text-[10px] uppercase tracking-widest transition ${
                availableOnly
                  ? "border-neutral-950 bg-neutral-950 text-white"
                  : "border-neutral-300 text-neutral-700 hover:border-neutral-950"
              }`}
            >
              <SlidersHorizontal size={15} />
              {availableOnly ? "Disponibles" : "Todos"}
            </button>
          </div>
        </div>

        <div className="mb-7 flex justify-between border-b border-neutral-200 pb-4">
          <p className="text-[10px] uppercase tracking-widest text-neutral-400">
            {filteredProducts.length} productos
          </p>

          <p className="text-[10px] uppercase tracking-widest text-neutral-400">
            Colección 2026
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-7">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index}>
                <div className="aspect-[3/4] animate-pulse bg-neutral-200" />
                <div className="mt-4 h-4 w-2/3 animate-pulse bg-neutral-200" />
                <div className="mt-3 h-3 w-1/3 animate-pulse bg-neutral-200" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-serif text-2xl">
              No encontramos productos
            </p>
            <p className="mt-3 text-sm text-neutral-400">
              Prueba con otro término de búsqueda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 lg:grid-cols-4 md:gap-x-7">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={addProduct}
              />
            ))}
          </div>
        )}
      </section>

      {/* BANNER EDITORIAL */}

      <section
        id="nosotros"
        className="relative overflow-hidden bg-[#dedbd3]"
      >
        <div className="grid md:grid-cols-2">

          <div className="relative min-h-[400px] md:min-h-[600px]">
            <img
              src="https://images.unsplash.com/photo-1617137968427-85924c800a22?w=1200&q=85"
              alt="Estilo formal masculino"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>

          <div className="flex flex-col justify-center px-8 py-16 md:px-16 lg:px-24">
            <span className="text-[10px] uppercase tracking-[0.35em] text-neutral-500">
              Nuestra filosofía
            </span>

            <h2 className="mt-6 font-serif text-4xl leading-tight md:text-6xl">
              La elegancia está en los detalles.
            </h2>

            <p className="mt-6 max-w-md text-sm leading-7 text-neutral-600">
              Creemos que vestir bien es una forma de expresión.
              Por eso seleccionamos prendas que transmiten
              seguridad, distinción y estilo.
            </p>

            <Link
              href="#coleccion"
              className="mt-9 inline-flex w-fit items-center gap-4 border-b border-neutral-800 pb-2 text-[10px] uppercase tracking-[0.2em]"
            >
              Descubrir colección
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}

      <footer className="bg-[#171715] px-6 py-14 text-white md:px-12">
        <div className="mx-auto flex max-w-[1400px] flex-col justify-between gap-10 md:flex-row">

          <div>
            <p className="font-serif text-3xl tracking-[0.2em]">
              ATELIER
            </p>
            <p className="mt-2 text-[9px] tracking-[0.4em] text-neutral-500">
              MENSWEAR
            </p>
            <p className="mt-6 max-w-xs text-xs leading-6 text-neutral-400">
              Sastrería contemporánea para quienes entienden
              que la elegancia nunca pasa de moda.
            </p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-widest">
              Navegación
            </p>

            <div className="mt-5 flex flex-col gap-3 text-xs text-neutral-400">
              <Link href="/">Inicio</Link>
              <Link href="#coleccion">Colección</Link>
              <Link href="/carrito">Mi carrito</Link>
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-widest">
              Atención
            </p>
            <p className="mt-5 text-xs text-neutral-400">
              Contáctanos para recibir asesoría.
            </p>
          </div>
        </div>

        <div className="mx-auto mt-14 max-w-[1400px] border-t border-white/10 pt-6 text-[9px] tracking-widest text-neutral-500">
          © 2026 ATELIER MENSWEAR. TODOS LOS DERECHOS RESERVADOS.
        </div>
      </footer>

      {/* NOTIFICACIÓN */}

      {message && (
        <div className="fixed bottom-6 left-1/2 z-[90] -translate-x-1/2 bg-neutral-950 px-6 py-4 text-xs text-white shadow-xl">
          {message}
        </div>
      )}

      {/* AUTENTICACIÓN */}

      <AuthModal
        open={authOpen}
        onClose={() => {
          setAuthOpen(false);
          setPendingProduct(null);
        }}
        onSuccess={handleAuthSuccess}
      />
    </main>
  );
}