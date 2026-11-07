import Link from "next/link";
import { ShoppingBag, ArrowUpRight } from "lucide-react";
import { getProductImage } from "@/src/lib/product-images";

export interface Product {
  id: number;
  nombre: string;
  precio: number | string;
  stock_actual: number;
  proveedor?: string;
}

interface Props {
  product: Product;
  onAdd: (id: number) => void;
}

export default function ProductCard({
  product,
  onAdd,
}: Props) {
  const price = Number(product.precio);

  return (
    <article className="group">
      <Link
        href={`/producto/${product.id}`}
        className="relative block aspect-[3/4] overflow-hidden bg-[#eeece7]"
      >
        <img
          src={getProductImage(product.id)}
          alt={product.nombre}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />

        <span className="absolute left-4 top-4 bg-[#faf9f6] px-3 py-1.5 text-[9px] uppercase tracking-[0.15em] text-neutral-800">
          Colección
        </span>

        <span className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-900 opacity-0 shadow-lg transition group-hover:opacity-100">
          <ArrowUpRight size={18} />
        </span>
      </Link>

      <div className="flex items-start justify-between gap-3 pt-4">
        <div className="min-w-0">
          <Link href={`/producto/${product.id}`}>
            <h3 className="truncate font-serif text-lg text-neutral-900 transition hover:text-neutral-500">
              {product.nombre}
            </h3>
          </Link>

          <p className="mt-1 text-[10px] uppercase tracking-widest text-neutral-400">
            {Number(product.stock_actual) > 0
              ? "Disponible"
              : "Agotado"}
          </p>

          <p className="mt-2 text-sm font-medium text-neutral-950">
            {price.toLocaleString("es-MX", {
              style: "currency",
              currency: "MXN",
            })}
          </p>
        </div>

        <button
          disabled={Number(product.stock_actual) <= 0}
          onClick={() => onAdd(product.id)}
          className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center border border-neutral-300 text-neutral-800 transition hover:border-neutral-950 hover:bg-neutral-950 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Agregar al carrito"
        >
          <ShoppingBag size={17} strokeWidth={1.5} />
        </button>
      </div>
    </article>
  );
}