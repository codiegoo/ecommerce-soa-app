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

    const { idProducto, cantidad } = await request.json();

    const productoId = Number(idProducto);
    const cantidadSolicitada = Number(cantidad);

    if (
      !Number.isInteger(productoId) ||
      productoId <= 0 ||
      !Number.isInteger(cantidadSolicitada) ||
      cantidadSolicitada <= 0
    ) {
      return badRequest("Producto o cantidad no válidos");
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

    const productos = await sql`
      SELECT
        p.id,
        p.nombre,
        s.stock_actual
      FROM "PRODUCTOS" p
      INNER JOIN "STOCK" s
        ON s.id_producto = p.id
      WHERE p.id = ${productoId}
      LIMIT 1
    `;

    if (productos.length === 0) {
      return NextResponse.json(
        { error: "Producto no encontrado o sin registro de inventario" },
        { status: 404 }
      );
    }

    const existencia = Number(productos[0].stock_actual);

    const detalles = await sql`
      SELECT cantidad
      FROM "DETALLE_CARRITO"
      WHERE id_carrito = ${idCarrito}
        AND id_producto = ${productoId}
      LIMIT 1
    `;

    const cantidadActual = Number(detalles[0]?.cantidad || 0);

    if (cantidadActual + cantidadSolicitada > existencia) {
      return NextResponse.json(
        { error: `Solo hay ${existencia} unidades disponibles` },
        { status: 409 }
      );
    }

    const resultado = await sql`
      WITH actualizado AS (
        UPDATE "DETALLE_CARRITO"
        SET cantidad = cantidad + ${cantidadSolicitada}
        WHERE id_carrito = ${idCarrito}
          AND id_producto = ${productoId}
        RETURNING *
      ),
      insertado AS (
        INSERT INTO "DETALLE_CARRITO" (
          id_carrito,
          id_producto,
          cantidad
        )
        SELECT
          ${idCarrito},
          ${productoId},
          ${cantidadSolicitada}
        WHERE NOT EXISTS (
          SELECT 1
          FROM "DETALLE_CARRITO"
          WHERE id_carrito = ${idCarrito}
            AND id_producto = ${productoId}
        )
        RETURNING *
      )
      SELECT * FROM actualizado
      UNION ALL
      SELECT * FROM insertado
    `;

    return NextResponse.json(
      {
        mensaje: "Producto agregado al carrito",
        detalle: resultado[0],
      },
      { status: 201 }
    );
  } catch (error) {
    return serverError(error);
  }
}