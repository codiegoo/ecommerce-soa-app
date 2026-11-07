import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (
      typeof token !== "string" ||
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 128
    ) {
      return NextResponse.json(
        { error: "La contraseña debe tener entre 8 y 128 caracteres." },
        { status: 400 }
      );
    }

    const tokenHash = createHash("sha256")
      .update(token)
      .digest("hex");

    const passwordHash = await bcrypt.hash(password, 12);

    // Consumir el token y actualizar la contraseña en una sola consulta.
    const result = await sql`
      WITH token_valido AS (
        UPDATE "TOKENS_RECUPERACION"
        SET usado = true
        WHERE token = ${tokenHash}
          AND usado = false
          AND fecha_expiracion > NOW()
        RETURNING id_usuario
      )
      UPDATE "USUARIOS" AS u
      SET password_hash = ${passwordHash}
      FROM token_valido AS t
      WHERE u.id = t.id_usuario
      RETURNING u.id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "El enlace es inválido, ya fue utilizado o ha expirado." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Tu contraseña fue actualizada correctamente.",
    });

  } catch (error) {
    console.error("Error al restablecer contraseña:", error);

    return NextResponse.json(
      { error: "No fue posible actualizar la contraseña." },
      { status: 500 }
    );
  }
}