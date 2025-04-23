import nodemailer from "nodemailer";
import { AuthServices } from "../services/authServices";
import { getLastRecords } from "../services/utilsServices";
import { categories } from "./Categories";

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

export const sendEmailRecovery = async (email: string, code: string) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "tcompraperu@gmail.com",
      pass: "uzof pfmc lcwz kgko",
    },
  });

  const mailOptions = {
    from: '"Recover Password" <tcompraperu@gmail.com>', //... Sustituye por el correo de la empresa
    to: email,
    subject: "Recovery Code - TCompraPeru.com",
    text: `Tu código de de recuperación es: ${code}`,
    html: `
    <html>
      <body>
        <div style="background-color: #D9D9D9; padding: 20px; text-align: center; font-family: Arial, sans-serif; border-radius: 15px;">
        <img src="https://img.freepik.com/vector-gratis/usuario-feliz-dando-revision-positiva-servicio-linea_74855-20137.jpg?w=826&t=st=1714004141~exp=1714004741~hmac=9c47701176b3973edbc3808b165eb529bce009b85e5939bf7a3fd9a76440ea44" alt="Promotional Image" style="width: 100%; max-width: 250px; height: auto; border-radius: 100%;">
          <h1 style="color: #5d3f92;">Recovery Code</h1>
          <p style="font-size: 18px; color: #6a1b9a;">Hemos recibido una solicitud para recuperar tu cuenta</p>
          <div style="margin: 20px; margin-right: 23vw; margin-left: 23vw; padding: 0.1%; background-color: #6D23F5; border-radius: 60px;">
            <p style="font-size: 32px; color: #f4e7ff;"><b>${code}</b></p>
          </div>
          <p style="color: #4a148c;">Por favor, ingresa este código para reestablecer tu contraseña.</p>
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

export const sendEmailCategories = async () => {
  try {
    const usersData = await AuthServices.getUsers();
    const companyAuth = usersData.companies;
    const userAuth = usersData.users;
    let email;
    const mailOptions = {
      from: '"TCompraPeru" <tcompraperu@gmail.com>', //... Sustituye por el correo de la empresa
      to: email,
      subject: "Nuevos Requerimientos en tus Rubros - TCompraPeru.com",
      text: `Nuevos Requerimientos en tus Rubros`,
      html: `
    <html>
    
    </html>
  `,
    };

    let cont = 0;
    let entityID;
    let rubros;
    let categoryName;
    if (companyAuth) {
      const countCompany = companyAuth?.length;
      while (cont < countCompany) {
        if (companyAuth[cont].auth_users.length > 0) {
          entityID = companyAuth[cont].uid;
          rubros = companyAuth[cont].categories;
          console.log(entityID);
          console.log(rubros);
          const requerimentsData = await getLastRecords(entityID, rubros);

          console.log("?=================");
          console.log(requerimentsData.data?.requeriments);
          if (requerimentsData.data?.requeriments.length > 0) {
            for (
              let index = 0;
              index < requerimentsData?.data?.requeriments.length;
              index++
            ) {
              // ARMAR CUERPO DEL MENSAJE CON LOS DATOS
              if (requerimentsData.data?.requeriments[index].length > 0) {
                categoryName =
                  requerimentsData.data?.requeriments[index][0].categoryName;

                console.log(categoryName);
                //   console.log(requerimentsData.data?.requeriments);
                //    console.log(requerimentsData.data?.requeriments.length);
              }
            }
          }
        } else {
          email = companyAuth[cont].email;
        }
        cont++;
      }
    }

    console.log(companyAuth?.length);
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error: error };
  }
};
