import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/src/lib/db";
import { getSession } from "@/src/lib/auth";
import {
  unauthorized,
  badRequest,
  serverError,
} from "@/src/lib/responses";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) return unauthorized();

    const resultado = await sql`
      SELECT
        c.id,
        c.id_usuario,
        c.direccion,
        c.rfc,
        u.nombre,
        u.correo,
        u.telefono
      FROM "CLIENTES" c
      INNER JOIN "USUARIOS" u
        ON u.id = c.id_usuario
      WHERE c.id_usuario = ${session.userId}
      LIMIT 1
    `;

    if (resultado.length === 0) {
      return NextResponse.json(
        { error: "No existe un perfil de cliente para este usuario" },
        { status: 404 }
      );
    }

    return NextResponse.json({ cliente: resultado[0] });
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) return unauthorized();

    const { direccion, rfc } = await request.json();

    if (!direccion || !rfc) {
      return badRequest("Dirección y RFC son obligatorios");
    }

    const resultado = await sql`
      UPDATE "CLIENTES"
      SET
        direccion = ${direccion},
        rfc = ${rfc}
      WHERE id_usuario = ${session.userId}
      RETURNING *
    `;

    if (resultado.length === 0) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      mensaje: "Datos del cliente actualizados",
      cliente: resultado[0],
    });
  } catch (error) {
    return serverError(error);
  }
}