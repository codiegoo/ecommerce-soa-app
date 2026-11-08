import { NextResponse } from "next/server";
import { sql } from "@/src/lib/db";
import { getSession } from "@/src/lib/auth";
import { unauthorized, serverError } from "@/src/lib/responses";



export async function GET() {
  try {
    const session = await getSession();

    if (!session) return unauthorized();

    const usuarios = await sql`
      SELECT
        u.id,
        u.nombre,
        u.correo,
        u.telefono,
        u.estado,
        r.nombre_rol,
        c.id AS id_cliente
      FROM "USUARIOS" u
      INNER JOIN "ROLES" r
        ON r.id = u.id_rol
      LEFT JOIN "CLIENTES" c
        ON c.id_usuario = u.id
      WHERE u.id = ${session.userId}
      LIMIT 1
    `;

    if (usuarios.length === 0) {
      return unauthorized();
    }

    const usuario = usuarios[0];

    return NextResponse.json({
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        telefono: usuario.telefono,
        estado: usuario.estado,
        rol: usuario.nombre_rol,
        idCliente: usuario.id_cliente,
      },
    });
  } catch (error) {
    return serverError(error);
  }
}