import { NextResponse } from "next/server";
import { deleteSession } from "@/src/lib/auth";

export async function POST() {
  await deleteSession();

  return NextResponse.json({
    mensaje: "Sesión cerrada correctamente",
  });
}