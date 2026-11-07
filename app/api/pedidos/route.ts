import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/src/lib/db";
import { getSession } from "@/src/lib/auth";
import {
  unauthorized,
  badRequest,
  serverError,
} from "@/src/lib/responses";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) return unauthorized();

    const body = await request.json();

    const idDireccion = Number(body.idDireccion);
    const idTipoPago = Number(body.idTipoPago);
    const idTarjeta = Number(body.idTarjeta);

    if (
      !Number.isInteger(idDireccion) ||
      idDireccion <= 0 ||
      !Number.isInteger(idTipoPago) ||
      idTipoPago <= 0 ||
      !Number.isInteger(idTarjeta) ||
      idTarjeta <= 0
    ) {
      return badRequest("Los datos del pedido no son válidos");
    }

    const clientes = await sql`
      SELECT id
      FROM "CLIENTES"
      WHERE id_usuario = ${session.userId}
      LIMIT 1
    `;

    if (clientes.length === 0) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    const idCliente = Number(clientes[0].id);

    const carritos = await sql`
      SELECT id
      FROM "CARRITO"
      WHERE id_cliente = ${idCliente}
        AND LOWER(estado) = 'activo'
      ORDER BY id DESC
      LIMIT 1
    `;

    if (carritos.length === 0) {
      return NextResponse.json(
        { error: "No tienes un carrito activo" },
        { status: 404 }
      );
    }

    const idCarrito = Number(carritos[0].id);

    const resultado = await sql`
      WITH pedido_nuevo AS (
        INSERT INTO "PEDIDOS" (
          id_carrito,
          id_cliente,
          id_direccion,
          id_tipo_pago,
          id_tarjeta,
          estado
        )
        SELECT
          ${idCarrito},
          ${idCliente},
          d.id,
          tp.id,
          t.id,
          'Pendiente'
        FROM "DIRECCIONES" d
        INNER JOIN "TIPOS_PAGO" tp
          ON tp.id = ${idTipoPago}
        INNER JOIN "TARJETAS" t
          ON t.id = ${idTarjeta}
        WHERE d.id = ${idDireccion}
          AND d.id_cliente = ${idCliente}
          AND t.id_cliente = ${idCliente}
          AND EXISTS (
            SELECT 1
            FROM "DETALLE_CARRITO" dc
            WHERE dc.id_carrito = ${idCarrito}
          )
        RETURNING *
      ),
      carrito_actualizado AS (
        UPDATE "CARRITO"
        SET estado = 'Procesado'
        WHERE id = ${idCarrito}
          AND EXISTS (
            SELECT 1 FROM pedido_nuevo
          )
        RETURNING id
      )
      SELECT pedido_nuevo.*
      FROM pedido_nuevo
      INNER JOIN carrito_actualizado
        ON carrito_actualizado.id = pedido_nuevo.id_carrito
    `;

    if (resultado.length === 0) {
      return NextResponse.json(
        {
          error: "No se pudo crear el pedido. Verifica tu dirección, tarjeta, método de pago y carrito.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        mensaje: "Pedido creado correctamente",
        pedido: resultado[0],
      },
      { status: 201 }
    );
  } catch (error) {
    return serverError(error);
  }
}