import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/src/lib/db";
import { getSession } from "@/src/lib/auth";
import {
  unauthorized,
  badRequest,
  serverError,
} from "@/src/lib/responses";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  { params }: Context
) {
  try {
    const session = await getSession();

    if (!session) return unauthorized();

    const { id } = await params;
    const direccionId = Number(id);

    if (!Number.isInteger(direccionId) || direccionId <= 0) {
      return badRequest("ID de dirección no válido");
    }

    const resultado = await sql`
      SELECT d.*
      FROM "DIRECCIONES" d
      INNER JOIN "CLIENTES" c
        ON c.id = d.id_cliente
      WHERE d.id = ${direccionId}
        AND c.id_usuario = ${session.userId}
      LIMIT 1
    `;

    if (resultado.length === 0) {
      return NextResponse.json(
        { error: "Dirección no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ direccion: resultado[0] });
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

    const { id } = await params;
    const direccionId = Number(id);

    if (!Number.isInteger(direccionId) || direccionId <= 0) {
      return badRequest("ID de dirección no válido");
    }

    const { colonia, codigoPostal } = await request.json();

    if (!colonia || !codigoPostal) {
      return badRequest("Colonia y código postal son obligatorios");
    }

    const resultado = await sql`
      UPDATE "DIRECCIONES" d
      SET
        colonia = ${colonia},
        codigo_postal = ${codigoPostal}
      FROM "CLIENTES" c
      WHERE d.id = ${direccionId}
        AND c.id = d.id_cliente
        AND c.id_usuario = ${session.userId}
      RETURNING d.*
    `;

    if (resultado.length === 0) {
      return NextResponse.json(
        { error: "Dirección no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      mensaje: "Dirección actualizada correctamente",
      direccion: resultado[0],
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

    const { id } = await params;
    const direccionId = Number(id);

    if (!Number.isInteger(direccionId) || direccionId <= 0) {
      return badRequest("ID de dirección no válido");
    }

    const resultado = await sql`
      DELETE FROM "DIRECCIONES" d
      USING "CLIENTES" c
      WHERE d.id = ${direccionId}
        AND c.id = d.id_cliente
        AND c.id_usuario = ${session.userId}
      RETURNING d.id
    `;

    if (resultado.length === 0) {
      return NextResponse.json(
        { error: "Dirección no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      mensaje: "Dirección eliminada correctamente",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudo eliminar la dirección. Puede estar asociada a un pedido o envío." },
      { status: 409 }
    );
  }
}