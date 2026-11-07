
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/src/lib/stripe";
import { sql } from "@/src/lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Webhook no autorizado." },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const body = await request.text();

    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("Firma Stripe inválida:", error);

    return NextResponse.json(
      { error: "Firma inválida." },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const checkout = event.data.object as Stripe.Checkout.Session;

        // No registrar pagos que todavía no están confirmados.
        if (checkout.payment_status !== "paid") {
          break;
        }

        const paymentIntent =
          typeof checkout.payment_intent === "string"
            ? checkout.payment_intent
            : checkout.payment_intent?.id;

        if (!paymentIntent) {
          throw new Error("No se encontró el PaymentIntent.");
        }

        const resultado = await sql`
          SELECT confirmar_pago_stripe(
            ${checkout.id},
            ${paymentIntent}
          ) AS resultado
        `;

        const estado = resultado[0]?.resultado;

        if (estado === "stock_insuficiente") {
          // No podemos surtir el pedido: solicitar reembolso.
          const refund = await stripe.refunds.create({
            payment_intent: paymentIntent,
          });

          if (refund.status === "succeeded") {
            await sql`
              UPDATE "PEDIDOS"
              SET estado = 'Reembolsado'
              WHERE stripe_checkout_session_id = ${checkout.id}
                AND estado = 'Pendiente'
            `;
          } else {
            await sql`
              UPDATE "PEDIDOS"
              SET estado = 'Reembolso pendiente'
              WHERE stripe_checkout_session_id = ${checkout.id}
                AND estado = 'Pendiente'
            `;
          }

          break;
        }

        if (
          !["procesado", "ya_procesado"].includes(estado)
        ) {
          throw new Error(
            `No se pudo procesar el pedido: ${estado}`
          );
        }

        break;
      }

      case "checkout.session.expired": {
        const checkout = event.data.object as Stripe.Checkout.Session;

        await sql`
          UPDATE "PEDIDOS"
          SET estado = 'Cancelado'
          WHERE stripe_checkout_session_id = ${checkout.id}
            AND estado = 'Pendiente'
        `;

        break;
      }

      case "checkout.session.async_payment_failed": {
        const checkout = event.data.object as Stripe.Checkout.Session;

        await sql`
          UPDATE "PEDIDOS"
          SET estado = 'Pago fallido'
          WHERE stripe_checkout_session_id = ${checkout.id}
            AND estado = 'Pendiente'
        `;

        break;
      }

      default:
        console.log("Evento Stripe no utilizado:", event.type);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("Error procesando webhook:", error);

    return NextResponse.json(
      { error: "Error procesando el evento." },
      { status: 500 }
    );
  }
}
