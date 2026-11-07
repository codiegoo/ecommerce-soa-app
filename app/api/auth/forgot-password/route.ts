import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { randomBytes, createHash } from "crypto";
import { sendPasswordResetEmail } from "@/src/lib/email";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: NextRequest) {
  try {
    const { correo } = await request.json();

    if (!correo || typeof correo !== "string") {
      return NextResponse.json(
        { error: "Ingresa un correo válido." },
        { status: 400 }
      );
    }

    const email = correo.trim().toLowerCase();

    const usuarios = await sql`
      SELECT id, correo
      FROM "USUARIOS"
      WHERE LOWER(correo) = ${email}
      LIMIT 1
    `;

    // La respuesta es la misma exista o no la cuenta.
    if (usuarios.length === 0) {
      return NextResponse.json({
        message: "Si el correo está registrado, recibirás un enlace de recuperación.",
      });
    }

    const usuario = usuarios[0];

    const token = randomBytes(32).toString("hex");

    // Guardamos el hash del token, nunca el token original.
    const tokenHash = createHash("sha256")
      .update(token)
      .digest("hex");

    // Invalidar solicitudes anteriores del usuario.
    await sql`
      UPDATE "TOKENS_RECUPERACION"
      SET usado = true
      WHERE id_usuario = ${usuario.id}
      AND usado = false
    `;

    // Crear token válido durante 30 minutos.
    await sql`
      INSERT INTO "TOKENS_RECUPERACION"
      (id_usuario, token, fecha_expiracion, usado)
      VALUES (
        ${usuario.id},
        ${tokenHash},
        NOW() + INTERVAL '30 minutes',
        false
      )
    `;

    const resetUrl =
      `${process.env.APP_URL}/restablecer-contrasena?token=${token}`;

    await sendPasswordResetEmail(usuario.correo, resetUrl);

    return NextResponse.json({
      message: "Si el correo está registrado, recibirás un enlace de recuperación.",
    });

  } catch (error) {
    console.error("Error al solicitar recuperación:", error);

    return NextResponse.json(
      { error: "No fue posible procesar la solicitud." },
      { status: 500 }
    );
  }
}