import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function PagoExitosoPage() {
  return (
    <main className="min-h-screen bg-[#faf9f6] flex items-center justify-center px-5">
      <div className="max-w-md w-full text-center bg-white p-10 shadow-sm">

        <CheckCircle2
          size={55}
          className="mx-auto text-green-600 mb-6"
        />

        <h1 className="font-serif text-3xl">
          ¡Gracias por tu compra!
        </h1>

        <p className="mt-4 text-sm text-neutral-500 leading-7">
          Hemos recibido tu regreso desde Stripe.
          Estamos verificando la confirmación del pago
          para registrar tu pedido.
        </p>

        <Link
          href="/"
          className="block mt-8 bg-black text-white py-4 text-xs tracking-widest"
        >
          VOLVER A LA TIENDA
        </Link>

      </div>
    </main>
  );
}