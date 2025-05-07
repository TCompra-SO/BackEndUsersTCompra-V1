import nodemailer from "nodemailer";
import { AuthServices } from "../services/authServices";
import { getLastRecords } from "../services/utilsServices";
import { categories } from "./Categories";
import { Console } from "console";
import { number } from "joi";
import { RequirementType } from "../types/globalTypes";
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "tcompraperu@gmail.com",
    pass: "uzof pfmc lcwz kgko",
  },
});
export const sendEmail = async (email: string, code: string) => {
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
  const mailOptions = {
    from: '"Recover Password" <tcompraperu@gmail.com>', //... Sustituye por el correo de la empresa
    to: email,
    subject: "Recovery Code - TCompraPeru.com",
    text: `Tu código de de recuperación es: ${code}`,
    html: `
    <html lang="es">
  <head>
        <meta http-equiv="content-type" content="text/html;charset=utf-8">
        <meta http-equiv="x-ua-compatible" content="ie=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="author" content="Tcompra.com">

        <link href="https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&amp;display=swap" rel="stylesheet">
        <title>Recovery Code</title>
    </head>
      <body>
        <table align="center" width="100%" style="max-width:800px;" cellpadding="0" cellspacing="0">
                <tbody>
                    <tr>
                        <td style="background: #510839;padding: 30px;text-align: center;border-radius: 1rem 1rem 0 0;">
                            <img src="https://ci3.googleusercontent.com/meips/ADKq_NY9FQjeiXMhx-R6CJjtEYZDxA1LG_aDEkBK1TJkYou3v-CWnl9JPLGGFU2N9MzoQ3Hd6tcs-x4lpppddMJyWnxUH2AEN8VtIO98AWxdvFtPw4lRdxSO5E6ZAulNDspPrx5fd_1KVRrtrQ=s0-d-e1-ft#https://res.cloudinary.com/dlxlveta2/image/upload/v1732549505/logo-white_qbdapd.png" alt="Logo Tcompra.com" height="80px">
                        </td>
                    </tr>
                    <tr>
                        <td style="background: #f7e9f1;color: #510839;;padding: 30px;text-align: center;">
                            <img src="https://res.cloudinary.com/dlxlveta2/image/upload/v1732549502/contrasena_yhk8rc.png" style="width: 44px;">
                            <h1 style="margin: 0;font-size: 30px;line-height: 1;">Código de Recuperación</h1>
                            <div style="font-size: 16px;margin: 10px 0 15px 0;">Hemos recibido una solicitud para recuperar tu cuenta</div>
                            <div style="margin: 20px; margin-right: 23vw; margin-left: 23vw; padding: 0.1%; background-color: #BC1373; border-radius: 60px;">
            <p style="font-size: 32px; color: #f4e7ff;"><b>${code}</b></p>
          </div>
                           <div style="font-size: 16px;margin: 10px 0 15px 0;">Por favor, ingresa este código para reestablecer tu contraseña.</div>
                        </td>
                    </tr>
                    <tr>
                       <td align="center" style="background:#bc1373;color:#fff;padding:30px;border-radius:0 0 1rem 1rem">
                  <table style="margin-bottom:10px" cellpadding="0" cellspacing="0">
                      <tbody><tr>
                          <td style="padding:0 3px" align="center"><a href="https://www.facebook.com/Tcompra/" style="text-decoration:none" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://www.facebook.com/Tcompra/&amp;source=gmail&amp;ust=1746629452809000&amp;usg=AOvVaw1ROAJk-rmCd6YDVCxjqSob"><div style="background:#fff;border-radius:50px;color:#bc1373;line-height:0;padding:10px"><img src="https://ci3.googleusercontent.com/meips/ADKq_NZdGd9ZhUOITJUlH2CBpVZfFpgg9EuQYqRYtsfTdW7PPqSjwARQFs1TK2wcPqsfEj9J2i9tcCF0DrabiAJplIay6Wo-JFGxb-Jpcmr2RAo9dTkeY5EiAMMNWCceqs0kRyVsuc4M2CA=s0-d-e1-ft#https://res.cloudinary.com/dlxlveta2/image/upload/v1732549504/facebook_nmomk4.png" height="15" class="CToWUd" data-bit="iit"></div></a></td>
                          <td style="padding:0 3px" align="center"><a href="https://www.instagram.com/tcompralatam/" style="text-decoration:none" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://www.instagram.com/tcompralatam/&amp;source=gmail&amp;ust=1746629452809000&amp;usg=AOvVaw1WQbccIgWEWU-SSnJoF0n7"><div style="background:#fff;border-radius:50px;color:#bc1373;line-height:0;padding:10px"><img src="https://ci3.googleusercontent.com/meips/ADKq_NYaT7EookfIJCK9taIgSPvac04egI5gNZx5hyxzq0siZXSNhbmIVVLGJIRgedl0KKZaCSwUuUY8gpJiTT-DJDVAft7SRF2UkmQMK9bp0nXOr-8OiaRX3cEhZEBqNXNeI0VmuisOUWDq=s0-d-e1-ft#https://res.cloudinary.com/dlxlveta2/image/upload/v1732549504/instagram_eigfod.png" height="15" class="CToWUd" data-bit="iit"></div></a></td>
                          <td style="padding:0 3px" align="center"><a href="https://www.youtube.com/channel/UCMllmt4Yz6googZOS9qPlLA" style="text-decoration:none" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://www.youtube.com/channel/UCMllmt4Yz6googZOS9qPlLA&amp;source=gmail&amp;ust=1746629452809000&amp;usg=AOvVaw2KUZI2MDiwrjVA83rr91Gs"><div style="background:#fff;border-radius:50px;color:#bc1373;line-height:0;padding:10px"><img src="https://ci3.googleusercontent.com/meips/ADKq_NaDZ-MBe0H-e6v0ty0hqaZDHu6plbSw6CLtKP1IcYASD_GlnvRJBtMY8FOXV7FvGumao5HYl_OwG1qrdKad8a06z17ltkxBtF9dLe5LHo9Ws0ssR4WVDWAVvMZvD2KnSkTDjTxY_Q=s0-d-e1-ft#https://res.cloudinary.com/dlxlveta2/image/upload/v1732549508/youtube_t1hgc1.png" height="15" class="CToWUd" data-bit="iit"></div></a></td>
                          <td style="padding:0 3px" align="center"><a href="https://www.linkedin.com/company/tcompra" style="text-decoration:none" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://www.linkedin.com/company/tcompra&amp;source=gmail&amp;ust=1746629452809000&amp;usg=AOvVaw12HHpn98-q1aKX4BRPwgPP"><div style="background:#fff;border-radius:50px;color:#bc1373;line-height:0;padding:10px"><img src="https://ci3.googleusercontent.com/meips/ADKq_NavxFeK0w3Px4YhZxTGHRR025-uNH2wsJ8n6-B8htWnpE-O4DPRCfb-XLrrYH0f6732qM9KWADtKcvmXTA-VuhwkQrs2zvRi---p8VCnqI5JGpuLE6ikC3m7oCq5D48Q_KvWBshp4w=s0-d-e1-ft#https://res.cloudinary.com/dlxlveta2/image/upload/v1732549505/linkedin_sdirhr.png" height="15" class="CToWUd" data-bit="iit"></div></a></td>
                      </tr>
                  </tbody></table>
                  <table style="width:100%" cellpadding="0" cellspacing="0">
                     <tbody>
    <tr>
        <td style="width:33.33%">
            <img src="https://ci3.googleusercontent.com/meips/ADKq_NZLBpktJmK5P0YBWVut89mylUJ7dr9QMc0LyDqRjiXcMv6mfj4WQ3zXkcUyRxjmCOc6mkkaZyAQrGsGfQ42_63ZTYm0wt7dJts3HfBMoobt_bZwDwL2mtK79pRTOhI67o5L6lQmFxQ9=s0-d-e1-ft#https://res.cloudinary.com/dlxlveta2/image/upload/v1732549503/copyright_vdex1e.png" height="16" style="vertical-align:middle;margin-right:5px" class="CToWUd" data-bit="iit">
            <b style="font-weight:600;color:#fff">2024 Tcompra.com</b>
        </td>
        <td style="width:33.33%;text-align:center">
            <a href="https://tcompra.com/" style="color:#fff;text-decoration:none" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://tcompra.com/&amp;source=gmail&amp;ust=1746629452809000&amp;usg=AOvVaw0mz_gtdPvZvrRF8t0F1-O8">
                <img src="https://ci3.googleusercontent.com/meips/ADKq_Nbo2FTXszANEnn7oeHY2B8eoNpP7CfuHCF2Hzrzo_X6Uj_wZjWP5sP098eKe5a2JAaCk8P8pAcBmxO7ls8Ka18zj6GVr-q3z2X-WxGuOZ91DwHeZogPNzyg8Wn7z019XY4DgTA=s0-d-e1-ft#https://res.cloudinary.com/dlxlveta2/image/upload/v1732549503/earth_dqzho0.png" height="16" style="vertical-align:middle;margin-right:5px" class="CToWUd" data-bit="iit">
                <b style="font-weight:600">tcompra.com</b>
            </a>
        </td>
        <td style="width:33.33%;text-align:right">
            <a style="text-decoration:none">
                <img src="https://ci3.googleusercontent.com/meips/ADKq_Nb7qp6Efih9lQMGLJ2hMVMlFkfpF4cC4_8jgF4eJATM5lYzX_8Mu9IveIl8n7zKzusFOYWLEtidcvD24K1yvgtp2NgOC7hJOJs5Qwv3fBBQDYBJkkWjereqLjc-fDQQnJfrjPd7=s0-d-e1-ft#https://res.cloudinary.com/dlxlveta2/image/upload/v1732549503/correo_ltrwmr.png" height="16" style="vertical-align:middle;margin-right:5px" class="CToWUd" data-bit="iit">
                <b style="font-weight:600;color:white">info@tcompra.com</b>
            </a>
        </td>
    </tr>
</tbody></table>
              </td>
                    </tr>
                </tbody>
            </table>
            
       
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
    let email, subEmail;

    let cont = 0;
    let entityID;
    let rubros: any;
    let categoryName = new Array();
    let categoryLiquidationName = new Array();
    let newsRequeriments: string[][] = new Array();
    let newsLiquidations: string[][] = new Array();
    if (companyAuth) {
      const countCompany = companyAuth?.length;

      while (cont < countCompany) {
        email = companyAuth[cont].email;
        entityID = companyAuth[cont].uid;
        rubros = companyAuth[cont].categories;
        const requerimentsData: any = await getLastRecords(entityID, rubros);

        // LLENAMOS REQUERIMIENTOS
        if (requerimentsData.data?.requeriments.length > 0) {
          for (
            let index = 0;
            index < requerimentsData?.data?.requeriments.length;
            index++
          ) {
            // ARMAR CUERPO DEL MENSAJE CON LOS DATOS

            for (
              let y = 0;
              y < 3; //requerimentsData.data?.requeriments[y].length;
              y++
            ) {
              if (requerimentsData.data?.requeriments[index].length > 0) {
                categoryName[index] =
                  requerimentsData.data?.requeriments[index][0].categoryName;

                if (!newsRequeriments[index]) {
                  newsRequeriments[index] = [];
                }

                newsRequeriments[index][y] =
                  requerimentsData.data?.requeriments[index][y];

                //   console.log(requerimentsData.data?.requeriments);
                //    console.log(requerimentsData.data?.requeriments.length);
              }
            }
          }
        }

        // LLENAMOS LIQUIDACIONES

        if (requerimentsData.data?.liquidations.length > 0) {
          for (
            let index = 0;
            index < requerimentsData?.data?.liquidations.length;
            index++
          ) {
            // ARMAR CUERPO DEL MENSAJE CON LOS DATOS

            for (
              let y = 0;
              y < 3; //requerimentsData.data?.requeriments[y].length;
              y++
            ) {
              if (requerimentsData.data?.liquidations[index].length > 0) {
                categoryLiquidationName[index] =
                  requerimentsData.data?.liquidations[index][0].categoryName;

                if (!newsLiquidations[index]) {
                  newsLiquidations[index] = [];
                }

                newsLiquidations[index][y] =
                  requerimentsData.data?.liquidations[index][y];
              }
            }
          }
        }

        if (companyAuth[cont].auth_users.length > 0) {
          //EMPEZAMOS A ENVIAR POR SUB EMAIL
          for (let i = 0; i < companyAuth[cont].auth_users.length; i++) {
            subEmail = companyAuth[cont].auth_users[i].email;
            //ENVIAMOS REQUERIMIENTOS
            bodyMailCategories(
              subEmail,
              categoryName,
              newsRequeriments,
              RequirementType.GOOD
            );

            //ENVIAMOS LIQUIDACIONES
            bodyMailCategories(
              subEmail,
              categoryLiquidationName,
              newsLiquidations,
              RequirementType.SALE
            );
          }

          //Enviamos REQUERIMIENTOS A LA EMPRESA PRINCIPAL
          bodyMailCategories(
            email,
            categoryName,
            newsRequeriments,
            RequirementType.GOOD
          );

          // ENVIAMOS LIQUIDACIONES A LA EMPRESA PRINCIPAL
          bodyMailCategories(
            email,
            categoryLiquidationName,
            newsLiquidations,
            RequirementType.SALE
          );
          categoryName = [];
          newsRequeriments = [];
          // LIMPIAMOS LIQUIDACIONES
          categoryLiquidationName = [];
          newsLiquidations = [];
        } else {
          email = companyAuth[cont].email;
          bodyMailCategories(
            email,
            categoryName,
            newsRequeriments,
            RequirementType.GOOD
          );

          bodyMailCategories(
            email,
            categoryLiquidationName,
            newsLiquidations,
            RequirementType.SALE
          );

          categoryName = [];
          newsRequeriments = [];
          // LIMPIAMOS LIQUIDACIONES
          categoryLiquidationName = [];
          newsLiquidations = [];
        }
        cont++;
      }
    }
    // ENVIAR A USUARIOS
    if (userAuth) {
      rubros = [];
      categoryName = [];

      let cont = 0;
      let countUser = userAuth.length;
      while (cont < countUser) {
        email = userAuth[cont].email;
        entityID = userAuth[cont].uid;
        rubros = userAuth[cont].categories;
        const requerimentsData: any = await getLastRecords(entityID, rubros);
        if (requerimentsData.data?.requeriments.length > 0) {
          for (
            let index = 0;
            index < requerimentsData?.data?.requeriments.length;
            index++
          ) {
            // ARMAR CUERPO DEL MENSAJE CON LOS DATOS

            for (
              let y = 0;
              y < 3; //requerimentsData.data?.requeriments[y].length;
              y++
            ) {
              if (requerimentsData.data?.requeriments[index].length > 0) {
                categoryName[index] =
                  requerimentsData.data?.requeriments[index][0].categoryName;

                if (!newsRequeriments[index]) {
                  newsRequeriments[index] = [];
                }

                newsRequeriments[index][y] =
                  requerimentsData.data?.requeriments[index][y];
              }
            }
          }
        }
        if (requerimentsData.data?.liquidations.length > 0) {
          for (
            let index = 0;
            index < requerimentsData?.data?.liquidations.length;
            index++
          ) {
            // ARMAR CUERPO DEL MENSAJE CON LOS DATOS

            for (
              let y = 0;
              y < 3; //requerimentsData.data?.requeriments[y].length;
              y++
            ) {
              if (requerimentsData.data?.liquidations[index].length > 0) {
                categoryLiquidationName[index] =
                  requerimentsData.data?.liquidations[index][0].categoryName;

                if (!newsLiquidations[index]) {
                  newsLiquidations[index] = [];
                }

                newsLiquidations[index][y] =
                  requerimentsData.data?.liquidations[index][y];
              }
            }
          }
        }

        // enviamos el Email
        bodyMailCategories(
          email,
          categoryName,
          newsRequeriments,
          RequirementType.GOOD
        );

        bodyMailCategories(
          email,
          categoryLiquidationName,
          newsLiquidations,
          RequirementType.SALE
        );
        categoryName = [];
        newsRequeriments = [];
        //limpiamos liquidaciones
        categoryLiquidationName = [];
        newsLiquidations = [];
        cont++;
      }
    }
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error: error };
  }
};

const bodyMailCategories = async (
  email: string,
  categories: string[],
  newsRequeriments: string[][],
  type: number
) => {
  try {
    let title = "";
    let subTitle = "";
    if (type === RequirementType.SALE) {
      title = "Últimas Liquidaciones en tus Rubros";
      subTitle =
        "Estas son las últimas Liquidaciones publicados en tus rubros.";
    } else {
      title = "Últimos Requerimientos en tus Rubros";
      subTitle =
        "Estos son los últimos Requerimientos publicados en tus rubros.";
    }
    const urlFront = process.env.URL_FRONTEND;

    // Construimos el bloque de HTML dinámico
    let dynamicContent = "";

    categories.forEach((category, index) => {
      const requerimientos = newsRequeriments[index];
      if (requerimientos && requerimientos.length > 0) {
        dynamicContent += `
          <tr>
            <td style="font-weight: 700;text-transform: uppercase;color: #510839;padding: 10px 0px;border-radius: 0.6rem;">${category}</td>
          </tr>
        `;

        requerimientos
          .filter((req: any) => req !== undefined) // Evita los undefined
          .forEach((req: any) => {
            const path = urlFront + "/detalle/" + req.type + "/" + req.uid;

            dynamicContent += `
      <tr>
        <td style="background: #fbedf5;border-radius: 0.6rem;color: #bC1373;padding: 15px;margin-bottom: 15px;">
          <div><a href="${path}" style="text-decoration: none;color: #BC1373">${req.name}</a></div>
          <div style="font-weight: 800;">${req.entityName}</div>
        </td>
      </tr>
      <tr><td style="height: 20px;"></td></tr>
    `;
          });
      }
    });

    const mailOptions = {
      from: '"TCompraPeru" <tcompraperu@gmail.com>', //... Sustituye por el correo de la empresa
      to: email,
      subject: `${title} - TCompraPeru.com`,
      text: `${title}`,
      html: `
    <html>
 <head>
        <meta http-equiv="content-type" content="text/html;charset=utf-8">
        <meta http-equiv="x-ua-compatible" content="ie=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="author" content="Tcompra.com">

        <link href="https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&amp;display=swap" rel="stylesheet">
        <title>Ultimos Requerimientos</title>
    </head>
  <body style ="background:#f7e9f1">
   <table align="center" width="100%" style="max-width:800px;" cellpadding="0" cellspacing="0">
                <tbody>
                    <tr>
                        <td style="background: #510839;padding: 30px;text-align: center;border-radius: 1rem 1rem 0 0;">
                            <img src="https://ci3.googleusercontent.com/meips/ADKq_NY9FQjeiXMhx-R6CJjtEYZDxA1LG_aDEkBK1TJkYou3v-CWnl9JPLGGFU2N9MzoQ3Hd6tcs-x4lpppddMJyWnxUH2AEN8VtIO98AWxdvFtPw4lRdxSO5E6ZAulNDspPrx5fd_1KVRrtrQ=s0-d-e1-ft#https://res.cloudinary.com/dlxlveta2/image/upload/v1732549505/logo-white_qbdapd.png" alt="Logo Tcompra.com" height="80px">
                        </td>
                    </tr>
                    <tr>
                        <td style="background: #f7e9f1;color: #510839;;padding: 30px;text-align: center;">
                            <img src="https://res.cloudinary.com/dlxlveta2/image/upload/v1732549506/requerimientos-u_ap9rrj.png" style="width: 44px;">
                            <h1 style="margin: 0;font-size: 30px;line-height: 1;">${title}</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="background: #fff;padding: 30px;">
                            <table cellpadding="0" cellspacing="0" width="100%">
                                <tbody><tr><td style="text-align: justify;">${subTitle}</td></tr>
                                  ${dynamicContent}
                    <tr align="center">
                      <td>
                        <a href="https://tcompra.com/" style="background: #BC1373;color: #fff !important;display: inline-block;font-weight: 700;border-radius: .6rem;padding: 8px 20px;font-size: 12px;text-decoration: none;margin: 15px;">Ir a Tcompra</a>
                      </td>

                    </tr>
                            </tbody></table>
                            <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 10px;">
                                <tbody><tr><td style="background: #fbedf5;border-radius: 0.6rem;color: #bC1373;padding: 10px;font-weight: 800;text-align: center;">No olvides calificar a tu proveedor</td></tr>
                            </tbody></table>
                            <table cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px;">
                                <tbody><tr align="right">
                                    <td colspan="2">Que tengas un excelente día.<br><b>Atentamente</b> el Equipo de <b>Tcompra.com</b></td>
                                </tr>
                            </tbody></table>
                        </td>
                    </tr>
                    <tr>
                       <td align="center" style="background:#bc1373;color:#fff;padding:30px;border-radius:0 0 1rem 1rem">
                  <table style="margin-bottom:10px" cellpadding="0" cellspacing="0">
                      <tbody><tr>
                          <td style="padding:0 3px" align="center"><a href="https://www.facebook.com/Tcompra/" style="text-decoration:none" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://www.facebook.com/Tcompra/&amp;source=gmail&amp;ust=1745518064768000&amp;usg=AOvVaw0yXBSrjsqaGxtVbmAfdlrT"><div style="background:#fff;border-radius:50px;color:#bc1373;line-height:0;padding:10px"><img src="https://ci3.googleusercontent.com/meips/ADKq_NZdGd9ZhUOITJUlH2CBpVZfFpgg9EuQYqRYtsfTdW7PPqSjwARQFs1TK2wcPqsfEj9J2i9tcCF0DrabiAJplIay6Wo-JFGxb-Jpcmr2RAo9dTkeY5EiAMMNWCceqs0kRyVsuc4M2CA=s0-d-e1-ft#https://res.cloudinary.com/dlxlveta2/image/upload/v1732549504/facebook_nmomk4.png" height="15" class="CToWUd" data-bit="iit"></div></a></td>
                          <td style="padding:0 3px" align="center"><a href="https://www.instagram.com/tcompralatam/" style="text-decoration:none" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://www.instagram.com/tcompralatam/&amp;source=gmail&amp;ust=1745518064768000&amp;usg=AOvVaw2R27MqmZsjNEYJooYfTsS7"><div style="background:#fff;border-radius:50px;color:#bc1373;line-height:0;padding:10px"><img src="https://ci3.googleusercontent.com/meips/ADKq_NYaT7EookfIJCK9taIgSPvac04egI5gNZx5hyxzq0siZXSNhbmIVVLGJIRgedl0KKZaCSwUuUY8gpJiTT-DJDVAft7SRF2UkmQMK9bp0nXOr-8OiaRX3cEhZEBqNXNeI0VmuisOUWDq=s0-d-e1-ft#https://res.cloudinary.com/dlxlveta2/image/upload/v1732549504/instagram_eigfod.png" height="15" class="CToWUd" data-bit="iit"></div></a></td>
                          <td style="padding:0 3px" align="center"><a href="https://www.youtube.com/channel/UCMllmt4Yz6googZOS9qPlLA" style="text-decoration:none" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://www.youtube.com/channel/UCMllmt4Yz6googZOS9qPlLA&amp;source=gmail&amp;ust=1745518064768000&amp;usg=AOvVaw3dF0F79XO7g3jVm_EQpvKX"><div style="background:#fff;border-radius:50px;color:#bc1373;line-height:0;padding:10px"><img src="https://ci3.googleusercontent.com/meips/ADKq_NaDZ-MBe0H-e6v0ty0hqaZDHu6plbSw6CLtKP1IcYASD_GlnvRJBtMY8FOXV7FvGumao5HYl_OwG1qrdKad8a06z17ltkxBtF9dLe5LHo9Ws0ssR4WVDWAVvMZvD2KnSkTDjTxY_Q=s0-d-e1-ft#https://res.cloudinary.com/dlxlveta2/image/upload/v1732549508/youtube_t1hgc1.png" height="15" class="CToWUd" data-bit="iit"></div></a></td>
                          <td style="padding:0 3px" align="center"><a href="https://www.linkedin.com/company/tcompra" style="text-decoration:none" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://www.linkedin.com/company/tcompra&amp;source=gmail&amp;ust=1745518064768000&amp;usg=AOvVaw18xLlUAKwYJTgbTSFA63hc"><div style="background:#fff;border-radius:50px;color:#bc1373;line-height:0;padding:10px"><img src="https://ci3.googleusercontent.com/meips/ADKq_NavxFeK0w3Px4YhZxTGHRR025-uNH2wsJ8n6-B8htWnpE-O4DPRCfb-XLrrYH0f6732qM9KWADtKcvmXTA-VuhwkQrs2zvRi---p8VCnqI5JGpuLE6ikC3m7oCq5D48Q_KvWBshp4w=s0-d-e1-ft#https://res.cloudinary.com/dlxlveta2/image/upload/v1732549505/linkedin_sdirhr.png" height="15" class="CToWUd" data-bit="iit"></div></a></td>
                      </tr>
                  </tbody></table>
                  <table style="width:100%" cellpadding="0" cellspacing="0">
                     <tbody>
    <tr>
        <td style="width:33.33%">
            <img src="https://ci3.googleusercontent.com/meips/ADKq_NZLBpktJmK5P0YBWVut89mylUJ7dr9QMc0LyDqRjiXcMv6mfj4WQ3zXkcUyRxjmCOc6mkkaZyAQrGsGfQ42_63ZTYm0wt7dJts3HfBMoobt_bZwDwL2mtK79pRTOhI67o5L6lQmFxQ9=s0-d-e1-ft#https://res.cloudinary.com/dlxlveta2/image/upload/v1732549503/copyright_vdex1e.png" height="16" style="vertical-align:middle;margin-right:5px" class="CToWUd" data-bit="iit">
            <b style="font-weight:600;color:#fff;">2024 Tcompra.com</b>
        </td>
        <td style="width:33.33%;text-align:center">
            <a href="https://tcompra.com/" style="color:#fff;text-decoration:none" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://tcompra.com/&amp;source=gmail&amp;ust=1745518064768000&amp;usg=AOvVaw22rPQ3ncPHbB6Lb6gS-Lnn">
                <img src="https://ci3.googleusercontent.com/meips/ADKq_Nbo2FTXszANEnn7oeHY2B8eoNpP7CfuHCF2Hzrzo_X6Uj_wZjWP5sP098eKe5a2JAaCk8P8pAcBmxO7ls8Ka18zj6GVr-q3z2X-WxGuOZ91DwHeZogPNzyg8Wn7z019XY4DgTA=s0-d-e1-ft#https://res.cloudinary.com/dlxlveta2/image/upload/v1732549503/earth_dqzho0.png" height="16" style="vertical-align:middle;margin-right:5px" class="CToWUd" data-bit="iit">
                <b style="font-weight:600">tcompra.com</b>
            </a>
        </td>
        <td style="width:33.33%;text-align:right">
            <a style="text-decoration:none">
                <img src="https://ci3.googleusercontent.com/meips/ADKq_Nb7qp6Efih9lQMGLJ2hMVMlFkfpF4cC4_8jgF4eJATM5lYzX_8Mu9IveIl8n7zKzusFOYWLEtidcvD24K1yvgtp2NgOC7hJOJs5Qwv3fBBQDYBJkkWjereqLjc-fDQQnJfrjPd7=s0-d-e1-ft#https://res.cloudinary.com/dlxlveta2/image/upload/v1732549503/correo_ltrwmr.png" height="16" style="vertical-align:middle;margin-right:5px" class="CToWUd" data-bit="iit">
                <b style="font-weight:600;color:white">info@tcompra.com</b>
            </a>
        </td>
    </tr>
</tbody></table>
              </td>
                                </tr>
                            </tbody></table>
                        </td>
                    </tr>
                </tbody>
            </table>
  </body>
</html>
  `,
    };

    if (dynamicContent) {
      const info = await transporter.sendMail(mailOptions);
      console.log("Message sent: %s", info.messageId);
      return { success: true, messageId: info.messageId };
    }
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error: error };
  }
};

export const sendEmailCertificate = async (email: string, state: boolean) => {
  let title, textBody, pathLogo;
  if (!state) {
    title = "Certificado Rechazado";
    textBody =
      "Lamentamos informarle que su certificado ha sido rechazado en esta ocasión. Entendemos que esta noticia puede ser decepcionante, pero queremos asegurarle que este proceso de validación es parte de nuestro compromiso con la integridad y la calidad. ¡No se desanime! Juntos, podemos trabajar hacia el éxito futuro. <b>¡Certificado Rechazado!</b>";
    pathLogo =
      "https://res.cloudinary.com/dlxlveta2/image/upload/v1732549502/certificado-no_rzcl7t.png";
  } else {
    title = "¡Certificado Validado!";
    textBody =
      "Nos complace anunciar que su certificado ha sido validado con éxito, este certificado no solo representa una validez de su empresa, sino también un testimonio de su arduo trabajo y compromiso. <b>¡Felicidades por este logro! ¡Certificado Validado!</b>";
    pathLogo =
      "https://res.cloudinary.com/dlxlveta2/image/upload/v1732549502/certificado_gkl1e2.png";
  }

  const mailOptions = {
    from: '"Estado del Certificado" <tcompraperu@gmail.com>', //... Sustituye por el correo de la empresa
    to: email,
    subject: "Estado del Certificado - TCompraPeru.com",
    text: `El estado de tu Certificado es: ${title}`,
    html: `
    <html lang="es">
  <head>
     <meta charset="UTF-8">
    <link rel="stylesheet" href="styles.css" /><head>
        <meta http-equiv="content-type" content="text/html;charset=utf-8">
        <meta http-equiv="x-ua-compatible" content="ie=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="author" content="Tcompra.com">

        <link href="https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&amp;display=swap" rel="stylesheet">
        <title>Certificados</title>

  </head>
  <body>
     <table align="center" width="100%" style="max-width:800px;" cellpadding="0" cellspacing="0">
                <tbody>
                    <tr>
                        <td style="background: #510839;padding: 30px;text-align: center;border-radius: 1rem 1rem 0 0;">
                            <img src="https://res.cloudinary.com/dlxlveta2/image/upload/v1732549505/logo-white_qbdapd.png" alt="Logo Tcompra.com" height="80px">
                        </td>
                    </tr>
                    <tr>
                        <td style="background: #f7e9f1;color: #510839;;padding: 30px;text-align: center;">
                            <img src="${pathLogo}" style="width: 44px;">
                            <h1 style="margin: 0;font-size: 30px;line-height: 1;">${title}</h1>
                            <div style="font-size: 16px;margin: 10px 0 15px 0;">${textBody}</div>
                            <a style="background: #BC1373;color: #fff !important;display: inline-block;text-align: center;font-weight: 700;position: relative;text-transform: uppercase;z-index: 1;border-radius: .6rem;padding: 8px 20px;font-size: 12px;cursor: pointer;text-decoration: none;" href="https://tcompra.com">Ir a TCompra</a>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="background:#bc1373;color:#fff;padding:30px;border-radius:0 0 1rem 1rem">
                  <table style="margin-bottom:10px" cellpadding="0" cellspacing="0">
                      <tbody><tr>
                          <td style="padding:0 3px" align="center"><a href="https://www.facebook.com/Tcompra/" style="text-decoration:none" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://www.facebook.com/Tcompra/&amp;source=gmail&amp;ust=1746561166904000&amp;usg=AOvVaw3cDBOnsaGSjj7id9_X6YDz"><div style="background:#fff;border-radius:50px;color:#bc1373;line-height:0;padding:10px"><img src="https://ci3.googleusercontent.com/meips/ADKq_NZdGd9ZhUOITJUlH2CBpVZfFpgg9EuQYqRYtsfTdW7PPqSjwARQFs1TK2wcPqsfEj9J2i9tcCF0DrabiAJplIay6Wo-JFGxb-Jpcmr2RAo9dTkeY5EiAMMNWCceqs0kRyVsuc4M2CA=s0-d-e1-ft#https://res.cloudinary.com/dlxlveta2/image/upload/v1732549504/facebook_nmomk4.png" height="15" class="CToWUd" data-bit="iit"></div></a></td>
                          <td style="padding:0 3px" align="center"><a href="https://www.instagram.com/tcompralatam/" style="text-decoration:none" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://www.instagram.com/tcompralatam/&amp;source=gmail&amp;ust=1746561166904000&amp;usg=AOvVaw1SWxFZCKZGt8vaGe1Tc2wQ"><div style="background:#fff;border-radius:50px;color:#bc1373;line-height:0;padding:10px"><img src="https://ci3.googleusercontent.com/meips/ADKq_NYaT7EookfIJCK9taIgSPvac04egI5gNZx5hyxzq0siZXSNhbmIVVLGJIRgedl0KKZaCSwUuUY8gpJiTT-DJDVAft7SRF2UkmQMK9bp0nXOr-8OiaRX3cEhZEBqNXNeI0VmuisOUWDq=s0-d-e1-ft#https://res.cloudinary.com/dlxlveta2/image/upload/v1732549504/instagram_eigfod.png" height="15" class="CToWUd" data-bit="iit"></div></a></td>
                          <td style="padding:0 3px" align="center"><a href="https://www.youtube.com/channel/UCMllmt4Yz6googZOS9qPlLA" style="text-decoration:none" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://www.youtube.com/channel/UCMllmt4Yz6googZOS9qPlLA&amp;source=gmail&amp;ust=1746561166904000&amp;usg=AOvVaw2plCSBz4jwh3tmR9_kbKL7"><div style="background:#fff;border-radius:50px;color:#bc1373;line-height:0;padding:10px"><img src="https://ci3.googleusercontent.com/meips/ADKq_NaDZ-MBe0H-e6v0ty0hqaZDHu6plbSw6CLtKP1IcYASD_GlnvRJBtMY8FOXV7FvGumao5HYl_OwG1qrdKad8a06z17ltkxBtF9dLe5LHo9Ws0ssR4WVDWAVvMZvD2KnSkTDjTxY_Q=s0-d-e1-ft#https://res.cloudinary.com/dlxlveta2/image/upload/v1732549508/youtube_t1hgc1.png" height="15" class="CToWUd" data-bit="iit"></div></a></td>
                          <td style="padding:0 3px" align="center"><a href="https://www.linkedin.com/company/tcompra" style="text-decoration:none" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://www.linkedin.com/company/tcompra&amp;source=gmail&amp;ust=1746561166904000&amp;usg=AOvVaw0PqmC2rOHPTmns1XUmkgVU"><div style="background:#fff;border-radius:50px;color:#bc1373;line-height:0;padding:10px"><img src="https://ci3.googleusercontent.com/meips/ADKq_NavxFeK0w3Px4YhZxTGHRR025-uNH2wsJ8n6-B8htWnpE-O4DPRCfb-XLrrYH0f6732qM9KWADtKcvmXTA-VuhwkQrs2zvRi---p8VCnqI5JGpuLE6ikC3m7oCq5D48Q_KvWBshp4w=s0-d-e1-ft#https://res.cloudinary.com/dlxlveta2/image/upload/v1732549505/linkedin_sdirhr.png" height="15" class="CToWUd" data-bit="iit"></div></a></td>
                      </tr>
                  </tbody></table>
                  <table style="width:100%" cellpadding="0" cellspacing="0">
                     <tbody>
    <tr>
        <td style="width:33.33%">
            <img src="https://ci3.googleusercontent.com/meips/ADKq_NZLBpktJmK5P0YBWVut89mylUJ7dr9QMc0LyDqRjiXcMv6mfj4WQ3zXkcUyRxjmCOc6mkkaZyAQrGsGfQ42_63ZTYm0wt7dJts3HfBMoobt_bZwDwL2mtK79pRTOhI67o5L6lQmFxQ9=s0-d-e1-ft#https://res.cloudinary.com/dlxlveta2/image/upload/v1732549503/copyright_vdex1e.png" height="16" style="vertical-align:middle;margin-right:5px" class="CToWUd" data-bit="iit">
            <b style="font-weight:600;color:#fff">2024 Tcompra.com</b>
        </td>
        <td style="width:33.33%;text-align:center">
            <a href="https://tcompra.com/" style="color:#fff;text-decoration:none" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://tcompra.com/&amp;source=gmail&amp;ust=1746561166904000&amp;usg=AOvVaw3t_xVgRq644wAaoM35bndG">
                <img src="https://ci3.googleusercontent.com/meips/ADKq_Nbo2FTXszANEnn7oeHY2B8eoNpP7CfuHCF2Hzrzo_X6Uj_wZjWP5sP098eKe5a2JAaCk8P8pAcBmxO7ls8Ka18zj6GVr-q3z2X-WxGuOZ91DwHeZogPNzyg8Wn7z019XY4DgTA=s0-d-e1-ft#https://res.cloudinary.com/dlxlveta2/image/upload/v1732549503/earth_dqzho0.png" height="16" style="vertical-align:middle;margin-right:5px" class="CToWUd" data-bit="iit">
                <b style="font-weight:600">tcompra.com</b>
            </a>
        </td>
        <td style="width:33.33%;text-align:right">
            <a style="text-decoration:none">
                <img src="https://ci3.googleusercontent.com/meips/ADKq_Nb7qp6Efih9lQMGLJ2hMVMlFkfpF4cC4_8jgF4eJATM5lYzX_8Mu9IveIl8n7zKzusFOYWLEtidcvD24K1yvgtp2NgOC7hJOJs5Qwv3fBBQDYBJkkWjereqLjc-fDQQnJfrjPd7=s0-d-e1-ft#https://res.cloudinary.com/dlxlveta2/image/upload/v1732549503/correo_ltrwmr.png" height="16" style="vertical-align:middle;margin-right:5px" class="CToWUd" data-bit="iit">
                <b style="font-weight:600;color:white">info@tcompra.com</b>
            </a>
        </td>
    </tr>
</tbody></table>
              </td>
                    </tr>
                </tbody>
            </table>
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

export const sendEmailWelcome = async (email: string, name: string) => {
  const mailOptions = {
    from: "Registro Exitoso <tcompraperu@gmail.com>", //... Sustituye por el correo de la empresa
    to: email,
    subject: "Registro Exitoso - TCompraPeru.com",
    text: `Bienvenido a TCompra : ${name}`,
    html: `
   <html lang="es">
  <head>
        <meta http-equiv="content-type" content="text/html;charset=utf-8">
        <meta http-equiv="x-ua-compatible" content="ie=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="author" content="Tcompra.com">

        <link href="https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&amp;display=swap" rel="stylesheet">
        <title>Bienvenida</title>
    </head>
  <body>
     <table align="center" width="100%" style="max-width:800px;" cellpadding="0" cellspacing="0">
                <tbody>
                    <tr>
                        <td style="background: #510839;padding: 30px;text-align: center;border-radius: 1rem 1rem 0 0;">
                            <img src="https://ci3.googleusercontent.com/meips/ADKq_NY9FQjeiXMhx-R6CJjtEYZDxA1LG_aDEkBK1TJkYou3v-CWnl9JPLGGFU2N9MzoQ3Hd6tcs-x4lpppddMJyWnxUH2AEN8VtIO98AWxdvFtPw4lRdxSO5E6ZAulNDspPrx5fd_1KVRrtrQ=s0-d-e1-ft#https://res.cloudinary.com/dlxlveta2/image/upload/v1732549505/logo-white_qbdapd.png" alt="Logo Tcompra.com" height="80px">
                        </td>
                    </tr>
                    <tr>
                        <td style="background: #f7e9f1;color: #510839;;padding: 30px;text-align: center;">
                            <img src="https://res.cloudinary.com/dlxlveta2/image/upload/v1732549507/user_tcbiyc.png" style="width: 44px;">
                            <h1 style="margin: 0;font-size: 30px;line-height: 1;">Gracias por Registrarte ${name}</h1>
                            <div style="font-size: 16px;margin: 10px 0 15px 0;">Tu registro fue exitoso. Estamos felices de que te unas a nosotros. ¡Empieza a explorar y aprovecha todo lo que tenemos para ti!</div>
                           <a style="background:#bc1373;color:#fff!important;display:inline-block;text-align:center;font-weight:700;text-transform:uppercase;border-radius:.6rem;padding:8px 20px;font-size:12px;text-decoration:none" href="https://tcompra.com" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://tcompra.com&amp;source=gmail&amp;ust=1746629452809000&amp;usg=AOvVaw3cUN82npyLPReSaNXxMfwV">Ir a TCompra</a>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="background:#bc1373;color:#fff;padding:30px;border-radius:0 0 1rem 1rem">
                  <table style="margin-bottom:10px" cellpadding="0" cellspacing="0">
                      <tbody><tr>
                          <td style="padding:0 3px" align="center"><a href="https://www.facebook.com/Tcompra/" style="text-decoration:none" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://www.facebook.com/Tcompra/&amp;source=gmail&amp;ust=1746629452809000&amp;usg=AOvVaw1ROAJk-rmCd6YDVCxjqSob"><div style="background:#fff;border-radius:50px;color:#bc1373;line-height:0;padding:10px"><img src="https://ci3.googleusercontent.com/meips/ADKq_NZdGd9ZhUOITJUlH2CBpVZfFpgg9EuQYqRYtsfTdW7PPqSjwARQFs1TK2wcPqsfEj9J2i9tcCF0DrabiAJplIay6Wo-JFGxb-Jpcmr2RAo9dTkeY5EiAMMNWCceqs0kRyVsuc4M2CA=s0-d-e1-ft#https://res.cloudinary.com/dlxlveta2/image/upload/v1732549504/facebook_nmomk4.png" height="15" class="CToWUd" data-bit="iit"></div></a></td>
                          <td style="padding:0 3px" align="center"><a href="https://www.instagram.com/tcompralatam/" style="text-decoration:none" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://www.instagram.com/tcompralatam/&amp;source=gmail&amp;ust=1746629452809000&amp;usg=AOvVaw1WQbccIgWEWU-SSnJoF0n7"><div style="background:#fff;border-radius:50px;color:#bc1373;line-height:0;padding:10px"><img src="https://ci3.googleusercontent.com/meips/ADKq_NYaT7EookfIJCK9taIgSPvac04egI5gNZx5hyxzq0siZXSNhbmIVVLGJIRgedl0KKZaCSwUuUY8gpJiTT-DJDVAft7SRF2UkmQMK9bp0nXOr-8OiaRX3cEhZEBqNXNeI0VmuisOUWDq=s0-d-e1-ft#https://res.cloudinary.com/dlxlveta2/image/upload/v1732549504/instagram_eigfod.png" height="15" class="CToWUd" data-bit="iit"></div></a></td>
                          <td style="padding:0 3px" align="center"><a href="https://www.youtube.com/channel/UCMllmt4Yz6googZOS9qPlLA" style="text-decoration:none" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://www.youtube.com/channel/UCMllmt4Yz6googZOS9qPlLA&amp;source=gmail&amp;ust=1746629452809000&amp;usg=AOvVaw2KUZI2MDiwrjVA83rr91Gs"><div style="background:#fff;border-radius:50px;color:#bc1373;line-height:0;padding:10px"><img src="https://ci3.googleusercontent.com/meips/ADKq_NaDZ-MBe0H-e6v0ty0hqaZDHu6plbSw6CLtKP1IcYASD_GlnvRJBtMY8FOXV7FvGumao5HYl_OwG1qrdKad8a06z17ltkxBtF9dLe5LHo9Ws0ssR4WVDWAVvMZvD2KnSkTDjTxY_Q=s0-d-e1-ft#https://res.cloudinary.com/dlxlveta2/image/upload/v1732549508/youtube_t1hgc1.png" height="15" class="CToWUd" data-bit="iit"></div></a></td>
                          <td style="padding:0 3px" align="center"><a href="https://www.linkedin.com/company/tcompra" style="text-decoration:none" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://www.linkedin.com/company/tcompra&amp;source=gmail&amp;ust=1746629452809000&amp;usg=AOvVaw12HHpn98-q1aKX4BRPwgPP"><div style="background:#fff;border-radius:50px;color:#bc1373;line-height:0;padding:10px"><img src="https://ci3.googleusercontent.com/meips/ADKq_NavxFeK0w3Px4YhZxTGHRR025-uNH2wsJ8n6-B8htWnpE-O4DPRCfb-XLrrYH0f6732qM9KWADtKcvmXTA-VuhwkQrs2zvRi---p8VCnqI5JGpuLE6ikC3m7oCq5D48Q_KvWBshp4w=s0-d-e1-ft#https://res.cloudinary.com/dlxlveta2/image/upload/v1732549505/linkedin_sdirhr.png" height="15" class="CToWUd" data-bit="iit"></div></a></td>
                      </tr>
                  </tbody></table>
                  <table style="width:100%" cellpadding="0" cellspacing="0">
                     <tbody>
    <tr>
        <td style="width:33.33%">
            <img src="https://ci3.googleusercontent.com/meips/ADKq_NZLBpktJmK5P0YBWVut89mylUJ7dr9QMc0LyDqRjiXcMv6mfj4WQ3zXkcUyRxjmCOc6mkkaZyAQrGsGfQ42_63ZTYm0wt7dJts3HfBMoobt_bZwDwL2mtK79pRTOhI67o5L6lQmFxQ9=s0-d-e1-ft#https://res.cloudinary.com/dlxlveta2/image/upload/v1732549503/copyright_vdex1e.png" height="16" style="vertical-align:middle;margin-right:5px" class="CToWUd" data-bit="iit">
            <b style="font-weight:600;color:#fff">2024 Tcompra.com</b>
        </td>
        <td style="width:33.33%;text-align:center">
            <a href="https://tcompra.com/" style="color:#fff;text-decoration:none" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://tcompra.com/&amp;source=gmail&amp;ust=1746629452809000&amp;usg=AOvVaw0mz_gtdPvZvrRF8t0F1-O8">
                <img src="https://ci3.googleusercontent.com/meips/ADKq_Nbo2FTXszANEnn7oeHY2B8eoNpP7CfuHCF2Hzrzo_X6Uj_wZjWP5sP098eKe5a2JAaCk8P8pAcBmxO7ls8Ka18zj6GVr-q3z2X-WxGuOZ91DwHeZogPNzyg8Wn7z019XY4DgTA=s0-d-e1-ft#https://res.cloudinary.com/dlxlveta2/image/upload/v1732549503/earth_dqzho0.png" height="16" style="vertical-align:middle;margin-right:5px" class="CToWUd" data-bit="iit">
                <b style="font-weight:600">tcompra.com</b>
            </a>
        </td>
        <td style="width:33.33%;text-align:right">
            <a style="text-decoration:none">
                <img src="https://ci3.googleusercontent.com/meips/ADKq_Nb7qp6Efih9lQMGLJ2hMVMlFkfpF4cC4_8jgF4eJATM5lYzX_8Mu9IveIl8n7zKzusFOYWLEtidcvD24K1yvgtp2NgOC7hJOJs5Qwv3fBBQDYBJkkWjereqLjc-fDQQnJfrjPd7=s0-d-e1-ft#https://res.cloudinary.com/dlxlveta2/image/upload/v1732549503/correo_ltrwmr.png" height="16" style="vertical-align:middle;margin-right:5px" class="CToWUd" data-bit="iit">
                <b style="font-weight:600;color:white">info@tcompra.com</b>
            </a>
        </td>
    </tr>
</tbody></table>
              </td>
                    </tr>
                </tbody>
            </table>
  </body>
</html>
  `,
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error: error };
  }
};
