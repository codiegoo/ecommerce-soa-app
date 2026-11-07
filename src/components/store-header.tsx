"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ShoppingBag,
  Search,
  Menu,
  X,
  UserRound,
} from "lucide-react";
import AuthModal from "./auth-modal";

export default function StoreHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [search, setSearch] = useState("");

  async function updateCartCount() {
    try {
      const response = await fetch("/api/carrito", {
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        setCartCount(0);
        return;
      }

      const data = await response.json();

      const count = (data.detalles || []).reduce(
        (total: number, item: { cantidad: number }) =>
          total + Number(item.cantidad),
        0
      );

      setCartCount(count);
    } catch {
      setCartCount(0);
    }
  }

  useEffect(() => {
    updateCartCount();

    const handler = () => updateCartCount();

    window.addEventListener("cart-updated", handler);

    return () => {
      window.removeEventListener("cart-updated", handler);
    };
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();

    window.dispatchEvent(
      new CustomEvent("store-search", {
        detail: search,
      })
    );

    if (window.location.pathname !== "/") {
      window.location.href = `/?q=${encodeURIComponent(search)}`;
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-[#faf9f6]/95 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-[1500px] items-center justify-between px-5 md:px-10">

          <button
            className="md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Abrir menú"
          >
            {menuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>

          <Link href="/" className="flex flex-col items-center">
            <span className="text-2xl font-serif tracking-[0.22em] text-neutral-950">
              ATELIER
            </span>
            <span className="text-[8px] tracking-[0.42em] text-neutral-500">
              MENSWEAR
            </span>
          </Link>

          <nav className="hidden items-center gap-9 md:flex">
            <Link href="/" className="text-xs uppercase tracking-[0.15em] text-neutral-700 hover:text-black">
              Inicio
            </Link>

            <a href="/#coleccion" className="text-xs uppercase tracking-[0.15em] text-neutral-700 hover:text-black">
              Colección
            </a>

            <a href="/#nosotros" className="text-xs uppercase tracking-[0.15em] text-neutral-700 hover:text-black">
              Nosotros
            </a>
          </nav>

          <div className="flex items-center gap-4">

            <form
              onSubmit={handleSearch}
              className="hidden items-center border-b border-neutral-300 pb-1 lg:flex"
            >
              <Search size={16} className="text-neutral-500" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar trajes..."
                className="w-36 bg-transparent px-2 text-xs outline-none placeholder:text-neutral-400"
              />
            </form>

            <button
              onClick={() => setAuthOpen(true)}
              className="hidden text-neutral-700 transition hover:text-black sm:block"
              aria-label="Mi cuenta"
            >
              <UserRound size={20} strokeWidth={1.5} />
            </button>

            <Link
              href="/carrito"
              className="relative text-neutral-800 transition hover:text-black"
              aria-label="Carrito"
            >
              <ShoppingBag size={21} strokeWidth={1.5} />

              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-950 px-1 text-[9px] text-white">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-neutral-200 bg-[#faf9f6] px-6 py-6 md:hidden">
            <nav className="flex flex-col gap-5">
              <Link href="/" onClick={() => setMenuOpen(false)} className="text-sm uppercase tracking-widest">
                Inicio
              </Link>

              <a href="/#coleccion" onClick={() => setMenuOpen(false)} className="text-sm uppercase tracking-widest">
                Colección
              </a>

              <a href="/#nosotros" onClick={() => setMenuOpen(false)} className="text-sm uppercase tracking-widest">
                Nosotros
              </a>

              <button
                onClick={() => {
                  setAuthOpen(true);
                  setMenuOpen(false);
                }}
                className="text-left text-sm uppercase tracking-widest"
              >
                Mi cuenta
              </button>
            </nav>
          </div>
        )}
      </header>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => {
          setAuthOpen(false);
          updateCartCount();
        }}
      />
    </>
  );
}