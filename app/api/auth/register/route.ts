import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import  {sql}  from "../../../../src/lib/db";
import { createSession } from "../../../../src/lib/auth";
import { badRequest, serverError } from "../../../../src/lib/responses";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      nombre,
      correo,
      telefono,
      password,
      direccion,
      rfc,
    } = body;

    if (
      !nombre ||
      !correo ||
      !telefono ||
      !password ||
      !direccion ||
      !rfc
    ) {
      return badRequest("Todos los campos son obligatorios");
    }

    if (typeof password !== "string" || password.length < 8) {
      return badRequest("La contraseña debe tener al menos 8 caracteres");
    }

    const correoNormalizado = String(correo).trim().toLowerCase();

    const existente = await sql`
      SELECT id
      FROM "USUARIOS"
      WHERE correo = ${correoNormalizado}
      LIMIT 1
    `;

    if (existente.length > 0) {
      return NextResponse.json(
        { error: "El correo ya está registrado" },
        { status: 409 }
      );
    }

    const roles = await sql`
      SELECT id
      FROM "ROLES"
      WHERE LOWER(nombre_rol) IN ('cliente', 'client')
      LIMIT 1
    `;

    if (roles.length === 0) {
      return NextResponse.json(
        { error: "No existe el rol Cliente en la tabla ROLES" },
        { status: 500 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const resultado = await sql`
      WITH nuevo_usuario AS (
        INSERT INTO "USUARIOS" (
          nombre,
          correo,
          telefono,
          password_hash,
          id_rol,
          estado
        )
        VALUES (
          ${String(nombre).trim()},
          ${correoNormalizado},
          ${String(telefono).trim()},
          ${passwordHash},
          ${roles[0].id},
          'Activo'
        )
        RETURNING id
      ),
      nuevo_cliente AS (
        INSERT INTO "CLIENTES" (
          id_usuario,
          direccion,
          rfc
        )
        SELECT
          id,
          ${String(direccion).trim()},
          ${String(rfc).trim()}
        FROM nuevo_usuario
        RETURNING id, id_usuario
      )
      SELECT
        nuevo_usuario.id AS id_usuario,
        nuevo_cliente.id AS id_cliente
      FROM nuevo_usuario
      JOIN nuevo_cliente
        ON nuevo_cliente.id_usuario = nuevo_usuario.id
    `;

    const usuario = resultado[0];

    await createSession(Number(usuario.id_usuario));

    return NextResponse.json(
      {
        mensaje: "Usuario registrado correctamente",
        usuario: {
          id: usuario.id_usuario,
          idCliente: usuario.id_cliente,
          nombre,
          correo: correoNormalizado,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return serverError(error);
  }
}