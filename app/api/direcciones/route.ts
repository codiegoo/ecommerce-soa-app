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

    const direcciones = await sql`
      SELECT d.*
      FROM "DIRECCIONES" d
      INNER JOIN "CLIENTES" c
        ON c.id = d.id_cliente
      WHERE c.id_usuario = ${session.userId}
      ORDER BY d.id DESC
    `;

    return NextResponse.json({ direcciones });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) return unauthorized();

    const { colonia, codigoPostal } = await request.json();

    if (!colonia || !codigoPostal) {
      return badRequest("Colonia y código postal son obligatorios");
    }

    const resultado = await sql`
      INSERT INTO "DIRECCIONES" (
        id_cliente,
        colonia,
        codigo_postal
      )
      SELECT
        c.id,
        ${colonia},
        ${codigoPostal}
      FROM "CLIENTES" c
      WHERE c.id_usuario = ${session.userId}
      RETURNING *
    `;

    if (resultado.length === 0) {
      return NextResponse.json(
        { error: "No se encontró el perfil del cliente" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        mensaje: "Dirección registrada correctamente",
        direccion: resultado[0],
      },
      { status: 201 }
    );
  } catch (error) {
    return serverError(error);
  }
}