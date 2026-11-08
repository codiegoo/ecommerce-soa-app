import { NextResponse } from "next/server";
import { sql } from "@/src/lib/db";
import { getSession } from "@/src/lib/auth";
import {
  unauthorized,
  serverError,
} from "@/src/lib/responses";



export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const clientes = await sql`
      SELECT id
      FROM "CLIENTES"
      WHERE id_usuario = ${session.userId}
      LIMIT 1
    `;

    if (clientes.length === 0) {
      return NextResponse.json(
        { error: "No existe un perfil de cliente" },
        { status: 404 }
      );
    }

    const idCliente = Number(clientes[0].id);

    let carritos = await sql`
      SELECT id, id_cliente, estado
      FROM "CARRITO"
      WHERE id_cliente = ${idCliente}
        AND LOWER(estado) = 'activo'
      ORDER BY id DESC
      LIMIT 1
    `;

    if (carritos.length === 0) {
      carritos = await sql`
        INSERT INTO "CARRITO" (
          id_cliente,
          estado
        )
        VALUES (
          ${idCliente},
          'Activo'
        )
        RETURNING id, id_cliente, estado
      `;
    }

    const carrito = carritos[0];

    const detalles = await sql`
      SELECT
        dc.id,
        dc.id_producto,
        dc.cantidad,
        p.nombre,
        p.precio,
        COALESCE(s.stock_actual, 0) AS stock_actual,
        (dc.cantidad * p.precio) AS subtotal
      FROM "DETALLE_CARRITO" dc
      INNER JOIN "PRODUCTOS" p
        ON p.id = dc.id_producto
      LEFT JOIN "STOCK" s
        ON s.id_producto = p.id
      WHERE dc.id_carrito = ${carrito.id}
      ORDER BY dc.id DESC
    `;

    const total = detalles.reduce(
      (suma, detalle) =>
        suma + Number(detalle.subtotal),
      0
    );

    return NextResponse.json({
      userId: session.userId,
      carrito,
      detalles,
      total,
    });
  } catch (error) {
    return serverError(error);
  }
}