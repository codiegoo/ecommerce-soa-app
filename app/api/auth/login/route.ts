import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "../../../../src/lib/db";
import { createSession } from "../../../../src/lib/auth";
import { badRequest, serverError } from "../../../../src/lib/responses";

export async function POST(request: NextRequest) {
  try {
    const { correo, password } = await request.json();

    if (!correo || !password) {
      return badRequest("Correo y contraseña son obligatorios");
    }

    const correoNormalizado = String(correo).trim().toLowerCase();

    const usuarios = await sql`
      SELECT
        u.id,
        u.nombre,
        u.correo,
        u.password_hash,
        u.estado,
        u.id_rol,
        r.nombre_rol
      FROM "USUARIOS" u
      INNER JOIN "ROLES" r
        ON r.id = u.id_rol
      WHERE u.correo = ${correoNormalizado}
      LIMIT 1
    `;

    if (usuarios.length === 0) {
      return NextResponse.json(
        { error: "Credenciales incorrectas" },
        { status: 401 }
      );
    }

    const usuario = usuarios[0];

    const passwordValida = await bcrypt.compare(
      password,
      usuario.password_hash
    );

    if (!passwordValida) {
      return NextResponse.json(
        { error: "Credenciales incorrectas" },
        { status: 401 }
      );
    }

    if (String(usuario.estado).toLowerCase() !== "activo") {
      return NextResponse.json(
        { error: "La cuenta está desactivada" },
        { status: 403 }
      );
    }

    await createSession(Number(usuario.id));

    return NextResponse.json({
      mensaje: "Inicio de sesión exitoso",
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.nombre_rol,
      },
    });
  } catch (error) {
    return serverError(error);
  }
}