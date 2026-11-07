import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/src/lib/db";
import { getSession } from "@/src/lib/auth";
import { unauthorized, badRequest, serverError } from "@/src/lib/responses";

type Context = {
  params: Promise<{ id: string }>;
};

async function esPersonalAutorizado(userId: number) {
  const resultado = await sql`
    SELECT LOWER(r.nombre_rol) AS rol
    FROM "USUARIOS" u
    JOIN "ROLES" r ON r.id = u.id_rol
    WHERE u.id = ${userId}
  `;

  return [
    "admin", "administrador", "manager", "gerente",
    "employee", "empleado", "stock clerk",
    "encargado de inventario",
  ].includes(String(resultado[0]?.rol));
}

export async function GET(
  request: NextRequest,
  { params }: Context
) {
  try {
    const { id } = await params;
    const productoId = Number(id);

    if (!Number.isInteger(productoId) || productoId <= 0) {
      return badRequest("ID de producto no válido");
    }

    const resultado = await sql`
      SELECT
        p.*,
        pr.nombre AS proveedor,
        COALESCE(s.stock_actual, 0) AS stock_actual,
        COALESCE(s.stock_minimo, 0) AS stock_minimo,
        COALESCE(s.stock_maximo, 0) AS stock_maximo
      FROM "PRODUCTOS" p
      JOIN "PROVEEDORES" pr
        ON pr.id = p.id_proveedor
      LEFT JOIN "STOCK" s
        ON s.id_producto = p.id
      WHERE p.id = ${productoId}
      LIMIT 1
    `;

    if (resultado.length === 0) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ producto: resultado[0] });
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: Context
) {
  try {
    const session = await getSession();

    if (!session) return unauthorized();

    if (!(await esPersonalAutorizado(session.userId))) {
      return NextResponse.json(
        { error: "No tienes permisos para modificar productos" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const productoId = Number(id);

    if (!Number.isInteger(productoId) || productoId <= 0) {
      return badRequest("ID de producto no válido");
    }

    const body = await request.json();

    const {
      nombre,
      lote,
      serie,
      caducidad,
      idProveedor,
      costo,
      precio,
    } = body;

    if (
      !nombre ||
      !lote ||
      !serie ||
      !caducidad ||
      !idProveedor ||
      costo == null ||
      precio == null
    ) {
      return badRequest("Debes enviar todos los campos del producto");
    }

    const resultado = await sql`
      UPDATE "PRODUCTOS"
      SET
        nombre = ${nombre},
        lote = ${lote},
        serie = ${serie},
        caducidad = ${caducidad},
        id_proveedor = ${Number(idProveedor)},
        costo = ${Number(costo)},
        precio = ${Number(precio)}
      WHERE id = ${productoId}
      RETURNING *
    `;

    if (resultado.length === 0) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      mensaje: "Producto actualizado correctamente",
      producto: resultado[0],
    });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: Context
) {
  try {
    const session = await getSession();

    if (!session) return unauthorized();

    if (!(await esPersonalAutorizado(session.userId))) {
      return NextResponse.json(
        { error: "No tienes permisos para eliminar productos" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const productoId = Number(id);

    if (!Number.isInteger(productoId) || productoId <= 0) {
      return badRequest("ID de producto no válido");
    }

    const resultado = await sql`
      DELETE FROM "PRODUCTOS"
      WHERE id = ${productoId}
      RETURNING id
    `;

    if (resultado.length === 0) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      mensaje: "Producto eliminado correctamente",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "No se pudo eliminar el producto. Puede estar relacionado con compras, ventas o carritos.",
      },
      { status: 409 }
    );
  }
}