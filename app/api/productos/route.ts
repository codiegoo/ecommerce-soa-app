import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/src/lib/db";
import { getSession } from "@/src/lib/auth";
import { unauthorized, badRequest, serverError } from "@/src/lib/responses";

async function esPersonalAutorizado(userId: number) {
  const resultado = await sql`
    SELECT r.nombre_rol
    FROM "USUARIOS" u
    INNER JOIN "ROLES" r ON r.id = u.id_rol
    WHERE u.id = ${userId}
  `;

  const rol = String(resultado[0]?.nombre_rol || "").toLowerCase();

  return [
    "admin",
    "administrador",
    "manager",
    "gerente",
    "employee",
    "empleado",
    "stock clerk",
    "encargado de inventario",
  ].includes(rol);
}

export async function GET() {
  try {
    const productos = await sql`
      SELECT
        p.id,
        p.nombre,
        p.lote,
        p.serie,
        p.caducidad,
        p.id_proveedor,
        p.costo,
        p.precio,
        pr.nombre AS proveedor,
        COALESCE(s.stock_actual, 0) AS stock_actual
      FROM "PRODUCTOS" p
      INNER JOIN "PROVEEDORES" pr
        ON pr.id = p.id_proveedor
      LEFT JOIN "STOCK" s
        ON s.id_producto = p.id
      ORDER BY p.id DESC
    `;

    return NextResponse.json({ productos });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) return unauthorized();

    if (!(await esPersonalAutorizado(session.userId))) {
      return NextResponse.json(
        { error: "No tienes permisos para registrar productos" },
        { status: 403 }
      );
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
      return badRequest("Faltan datos del producto");
    }

    if (
      !Number.isInteger(Number(idProveedor)) ||
      Number(costo) < 0 ||
      Number(precio) < 0 ||
      !Number.isFinite(Number(costo)) ||
      !Number.isFinite(Number(precio))
    ) {
      return badRequest("Los datos numéricos no son válidos");
    }

    const resultado = await sql`
      INSERT INTO "PRODUCTOS" (
        nombre,
        lote,
        serie,
        caducidad,
        id_proveedor,
        costo,
        precio
      )
      VALUES (
        ${nombre},
        ${lote},
        ${serie},
        ${caducidad},
        ${Number(idProveedor)},
        ${Number(costo)},
        ${Number(precio)}
      )
      RETURNING *
    `;

    return NextResponse.json(
      {
        mensaje: "Producto registrado correctamente",
        producto: resultado[0],
      },
      { status: 201 }
    );
  } catch (error) {
    return serverError(error);
  }
}