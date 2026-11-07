
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/src/lib/db";
import { getSession } from "@/src/lib/auth";
import { stripe } from "@/src/lib/stripe";


function toCents(value: string | number) {
  const [integer, decimals = ""] = String(value).split(".");

  return (
    Number(integer) * 100 +
    Number((decimals + "00").slice(0, 2))
  );
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.userId) {
      return NextResponse.json(
        { error: "Debes iniciar sesión." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const direccionId = Number(body.direccionId);

    if (!Number.isInteger(direccionId) || direccionId <= 0) {
      return NextResponse.json(
        { error: "Selecciona una dirección válida." },
        { status: 400 }
      );
    }

    // 1. Obtener cliente.
    const clientes = await sql`
      SELECT id
      FROM "CLIENTES"
      WHERE id_usuario = ${session.userId}
      LIMIT 1
    `;

    if (!clientes.length) {
      return NextResponse.json(
        { error: "No se encontró tu cuenta de cliente." },
        { status: 404 }
      );
    }

    const clienteId = clientes[0].id;

    // 2. Validar que la dirección pertenezca al cliente.
    const direcciones = await sql`
      SELECT
        d.id,
        d.colonia,
        d.codigo_postal,
        c.direccion,
        u.correo
      FROM "DIRECCIONES" d
      INNER JOIN "CLIENTES" c
        ON c.id = d.id_cliente
      INNER JOIN "USUARIOS" u
        ON u.id = c.id_usuario
      WHERE d.id = ${direccionId}
        AND d.id_cliente = ${clienteId}
      LIMIT 1
    `;

    if (!direcciones.length) {
      return NextResponse.json(
        { error: "La dirección seleccionada no es válida." },
        { status: 403 }
      );
    }

    const direccion = direcciones[0];

    // 3. Obtener carrito activo.
    const carritos = await sql`
      SELECT id
      FROM "CARRITO"
      WHERE id_cliente = ${clienteId}
        AND LOWER(TRIM(estado)) IN ('activo', 'active')
      ORDER BY id DESC
      LIMIT 1
    `;

    if (!carritos.length) {
      return NextResponse.json(
        { error: "No tienes un carrito activo." },
        { status: 400 }
      );
    }

    const carritoId = carritos[0].id;

    // 4. Consultar productos y existencias.
    const productos = await sql`
      SELECT
        p.id,
        p.nombre,
        p.precio::text AS precio,
        dc.cantidad,
        s.stock_actual
      FROM "DETALLE_CARRITO" dc
      INNER JOIN "PRODUCTOS" p
        ON p.id = dc.id_producto
      LEFT JOIN "STOCK" s
        ON s.id_producto = p.id
      WHERE dc.id_carrito = ${carritoId}
    `;

    if (!productos.length) {
      return NextResponse.json(
        { error: "Tu carrito está vacío." },
        { status: 400 }
      );
    }

    for (const producto of productos) {
      if (
        Number(producto.cantidad) <= 0 ||
        producto.stock_actual === null ||
        Number(producto.stock_actual) < Number(producto.cantidad)
      ) {
        return NextResponse.json(
          {
            error: `No hay existencias suficientes de ${producto.nombre}.`,
          },
          { status: 409 }
        );
      }

      if (toCents(producto.precio) <= 0) {
        return NextResponse.json(
          { error: "Uno de los productos tiene un precio inválido." },
          { status: 400 }
        );
      }
    }

    // 5. Obtener el tipo de pago Stripe.
    const tiposPago = await sql`
      SELECT id
      FROM "TIPOS_PAGO"
      WHERE LOWER(nombre) = 'stripe checkout'
      LIMIT 1
    `;

    if (!tiposPago.length) {
      throw new Error("No existe el tipo de pago Stripe Checkout.");
    }

    const tipoPagoId = tiposPago[0].id;

    // 6. Crear pedido y guardar una copia de sus productos.
    // Se utiliza una sola sentencia SQL para ambas operaciones.
    const pedidos = await sql`
      WITH nuevo_pedido AS (
        INSERT INTO "PEDIDOS" (
          id_carrito,
          id_cliente,
          id_direccion,
          id_tipo_pago,
          id_tarjeta,
          estado,
          total
        )
        SELECT
          ${carritoId},
          ${clienteId},
          ${direccionId},
          ${tipoPagoId},
          NULL,
          'Pendiente',
          SUM(dc.cantidad * p.precio)
        FROM "DETALLE_CARRITO" dc
        INNER JOIN "PRODUCTOS" p
          ON p.id = dc.id_producto
        WHERE dc.id_carrito = ${carritoId}
        RETURNING id, id_carrito
      ),
      nuevos_detalles AS (
        INSERT INTO "DETALLE_PEDIDOS" (
          id_pedido,
          id_producto,
          cantidad,
          precio_unitario
        )
        SELECT
          np.id,
          dc.id_producto,
          dc.cantidad,
          p.precio
        FROM nuevo_pedido np
        INNER JOIN "DETALLE_CARRITO" dc
          ON dc.id_carrito = np.id_carrito
        INNER JOIN "PRODUCTOS" p
          ON p.id = dc.id_producto
        RETURNING id
      )
      SELECT id FROM nuevo_pedido
    `;

    if (!pedidos.length) {
      throw new Error("No fue posible crear el pedido.");
    }

    const pedidoId = pedidos[0].id;

    // 7. Recuperar los detalles guardados.
    const detalles = await sql`
      SELECT
        dp.cantidad,
        dp.precio_unitario::text AS precio,
        p.nombre
      FROM "DETALLE_PEDIDOS" dp
      INNER JOIN "PRODUCTOS" p
        ON p.id = dp.id_producto
      WHERE dp.id_pedido = ${pedidoId}
    `;

    const lineItems = detalles.map((item) => ({
      price_data: {
        currency: "mxn",
        product_data: {
          name: item.nombre,
        },
        unit_amount: toCents(item.precio),
      },
      quantity: Number(item.cantidad),
    }));

    // 8. Crear sesión de Stripe.
    const baseUrl = process.env.APP_URL;

    if (!baseUrl) {
      throw new Error("Falta configurar APP_URL.");
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      locale: "es-419",
      customer_email: direccion.correo,
      client_reference_id: String(pedidoId),

      metadata: {
        orderId: String(pedidoId),
        addressId: String(direccionId),
      },

      payment_intent_data: {
        metadata: {
          orderId: String(pedidoId),
        },
      },

      success_url:
        `${baseUrl}/pago-exitoso?session_id={CHECKOUT_SESSION_ID}`,

      cancel_url:
        `${baseUrl}/pago-cancelado?pedido=${pedidoId}`,
    });

    // 9. Relacionar la sesión con el pedido.
    await sql`
      UPDATE "PEDIDOS"
      SET stripe_checkout_session_id = ${checkoutSession.id}
      WHERE id = ${pedidoId}
        AND estado = 'Pendiente'
    `;

    return NextResponse.json({
      url: checkoutSession.url,
    });

  } catch (error) {
    console.error("Error al iniciar Checkout:", error);

    return NextResponse.json(
      { error: "No fue posible iniciar el pago." },
      { status: 500 }
    );
  }
}
