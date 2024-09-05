import nodemailer from "nodemailer";

export const sendEmail = async (email: string, code: string) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "tcompraperu@gmail.com",
      pass: "uzof pfmc lcwz kgko",
    },
  });

  const mailOptions = {
    from: '"Validate Code" <tcompraperu@gmail.com>', //... Sustituye por el correo de la empresa
    to: email,
    subject: "Verification Code - TCompraPeru.com",
    text: `Tu código de verificación es: ${code}`,
    html: `
    <html>
      <body>
        <div style="background-color: #D9D9D9; padding: 20px; text-align: center; font-family: Arial, sans-serif; border-radius: 15px;">
        <img src="https://img.freepik.com/vector-gratis/usuario-feliz-dando-revision-positiva-servicio-linea_74855-20137.jpg?w=826&t=st=1714004141~exp=1714004741~hmac=9c47701176b3973edbc3808b165eb529bce009b85e5939bf7a3fd9a76440ea44" alt="Promotional Image" style="width: 100%; max-width: 250px; height: auto; border-radius: 100%;">
          <h1 style="color: #5d3f92;">Verification Code</h1>
          <p style="font-size: 18px; color: #6a1b9a;">¡Gracias por registrarte!</p>
          <div style="margin: 20px; margin-right: 23vw; margin-left: 23vw; padding: 0.1%; background-color: #6D23F5; border-radius: 60px;">
            <p style="font-size: 32px; color: #f4e7ff;"><b>${code}</b></p>
          </div>
          <p style="color: #4a148c;">Por favor, ingresa este código para verificar tu cuenta.</p>
        </div>
      </body>
    </html>
  `,
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error: error };
  }
};
