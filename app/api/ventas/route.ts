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

    if (!session) return unauthorized();

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

    const ventas = await sql`
      SELECT
        v.id,
        v.id_pedido,
        v.fecha,
        v.total,
        p.estado AS estado_pedido
      FROM "VENTAS" v
      INNER JOIN "PEDIDOS" p
        ON p.id = v.id_pedido
      WHERE v.id_cliente = ${idCliente}
      ORDER BY v.fecha DESC, v.id DESC
    `;

    const detalles = await sql`
      SELECT
        dv.id,
        dv.id_venta,
        dv.id_producto,
        dv.cantidad,
        dv.precio_unitario,
        pr.nombre AS producto,
        (dv.cantidad * dv.precio_unitario) AS subtotal
      FROM "DETALLE_VENTAS" dv
      INNER JOIN "PRODUCTOS" pr
        ON pr.id = dv.id_producto
      INNER JOIN "VENTAS" v
        ON v.id = dv.id_venta
      WHERE v.id_cliente = ${idCliente}
      ORDER BY dv.id
    `;

    const ventasConDetalles = ventas.map((venta) => ({
      ...venta,
      detalles: detalles.filter(
        (detalle) => Number(detalle.id_venta) === Number(venta.id)
      ),
    }));

    return NextResponse.json({
      ventas: ventasConDetalles,
    });
  } catch (error) {
    return serverError(error);
  }
}