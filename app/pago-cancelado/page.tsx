import Link from "next/link";
import { XCircle } from "lucide-react";

export default function PagoCanceladoPage() {
  return (
    <main className="min-h-screen bg-[#faf9f6] flex items-center justify-center px-5">
      <div className="max-w-md w-full text-center bg-white p-10 shadow-sm">

        <XCircle
          size={55}
          className="mx-auto text-neutral-400 mb-6"
        />

        <h1 className="font-serif text-3xl">
          Pago cancelado
        </h1>

        <p className="mt-4 text-sm text-neutral-500 leading-7">
          No se completó el pago. Tu carrito sigue disponible
          para que puedas intentarlo nuevamente.
        </p>

        <Link
          href="/carrito"
          className="block mt-8 bg-black text-white py-4 text-xs tracking-widest"
        >
          VOLVER AL CARRITO
        </Link>

      </div>
    </main>
  );
}