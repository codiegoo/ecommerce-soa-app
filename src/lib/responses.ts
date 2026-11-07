import { NextResponse } from "next/server";

export function unauthorized() {
  return NextResponse.json(
    { error: "No has iniciado sesión" },
    { status: 401 }
  );
}

export function badRequest(message: string) {
  return NextResponse.json(
    { error: message },
    { status: 400 }
  );
}

export function serverError(error: unknown) {
  console.error(error);

  return NextResponse.json(
    { error: "Error interno del servidor" },
    { status: 500 }
  );
}