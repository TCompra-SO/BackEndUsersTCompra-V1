const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "mail.tcompra.com",
    port: 587,
    secure: false, // 587 usa STARTTLS
    auth: {
        user: "contacto@tcompra.com",
        pass: "K+OA*+5YkqkFBqGP", // ← reemplaza con la contraseña real
    },
    tls: {
        rejectUnauthorized: false,
    },
});

// 1) Verificar conexión
transporter.verify((error, success) => {
    if (error) {
        console.error("❌ Error al conectar SMTP:", error.message);
    } else {
        console.log("✅ SMTP listo para enviar correos");
    }
});

// 2) Enviar correo de prueba
transporter
    .sendMail({
        from: '"Prueba Tcompra" <contacto@tcompra.com>',
        to: "contacto@tcompra.com",
        subject: "Prueba SMTP - Tcompra",
        text: "¡Funciona! Correo enviado desde Node con cPanel.",
        html: "<b>¡Funciona!</b> Correo enviado desde Node con cPanel.",
    })
    .then((info) => {
        console.log("✅ Correo enviado:", info.messageId);
    })
    .catch((err) => {
        console.error("❌ Error al enviar:", err.message);
    });