import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Restablece tu contraseña | Atelier Menswear",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:35px;color:#222;">
        <h1 style="letter-spacing:4px;text-align:center;">
          ATELIER
        </h1>

        <p>Hola,</p>

        <p>
          Recibimos una solicitud para restablecer la contraseña
          de tu cuenta.
        </p>

        <div style="text-align:center;margin:35px 0;">
          <a href="${resetUrl}"
             style="background:#171717;color:white;padding:15px 30px;
             text-decoration:none;letter-spacing:1px;">
            RESTABLECER CONTRASEÑA
          </a>
        </div>

        <p>
          Este enlace vence en 30 minutos y solo puede utilizarse una vez.
        </p>

        <p>
          Si no solicitaste este cambio, puedes ignorar este correo.
        </p>

        <hr style="border:none;border-top:1px solid #ddd;margin:30px 0;" />

        <p style="text-align:center;color:#888;font-size:12px;">
          ATELIER MENSWEAR · Elegancia en cada detalle
        </p>
      </div>
    `,
  });
}