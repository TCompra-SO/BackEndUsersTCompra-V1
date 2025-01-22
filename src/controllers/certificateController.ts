import { Request, response, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { CertificateService } from "../services/certificateServices";
import { RequestExt } from "../interfaces/req-ext";

import { JwtPayload } from "jsonwebtoken";

// Configuración para almacenar archivos en una carpeta temporal
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// Filtrar solo archivos PDF
const fileFilter = (req: Request, file: Express.Multer.File, cb: any) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(
      new Error("Formato de archivo no permitido. Solo se permiten PDF"),
      false
    );
  }
};

// Configuración de multer para manejar los archivos PDF y las descripciones (utilizando .fields)
export const upload = multer({
  storage,
  fileFilter,
  limits: { files: 50, fileSize: 5 * 1024 * 1024 }, // Limitar 50 archivos PDF, 5MB cada uno
}).fields([
  { name: "documents", maxCount: 50 }, // Hasta 50 archivos PDF
  // Descripciones para los archivos (sin límite específico)
]);

// Controlador de la carga de certificados
export const uploadCertificateController = async (
  req: Request,
  res: Response
) => {
  try {
    const { companyID } = req.body;

    const files = req.files as {
      documents?: Express.Multer.File[];
      name?: string | string[];
    };

    const name = req.body.name;
    const nameArray = Array.isArray(name) ? name : [name]; // Asegurarte de manejar tanto una sola descripción como múltiples
    // Validar que los documentos y descripciones coincidan
    if (!files.documents || files.documents.length === 0) {
      return res
        .status(400)
        .json({ message: "Debes cargar al menos un documento." });
    }
    if (!nameArray || nameArray.length !== files.documents.length) {
      return res.status(400).json({
        message: "Debes proporcionar una descripción para cada documento.",
      });
    }

    const filePaths = files.documents.map((file, index) => ({
      filePath: file.path,
      name: nameArray[index] || file.originalname,
    }));

    const responseUser = await CertificateService.uploadCertificates(
      filePaths,
      companyID
    );

    // Eliminar archivos temporales
    for (const file of files.documents) {
      fs.unlink(file.path, (err) => {
        if (err) console.error("Error al eliminar archivo:", err);
      });
    }

    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error al procesar la carga:", error);
    res.status(500).json({ message: "Error al cargar los documentos", error });
  }
};

export const getCertificatesController = async (
  req: RequestExt,
  res: Response
) => {
  const { companyID, page, pageSize } = req.params;

  const { uid } = req.user as JwtPayload;
  if (uid !== companyID) {
    return res.status(400).send({
      success: false,
      msg: "Usuario incorrecto.",
    });
  }
  try {
    const responseUser = await CertificateService.getCertificates(
      companyID,
      Number(page),
      Number(pageSize)
    );
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en getCertificatesController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

export const getCertificateByIdController = async (
  req: Request,
  res: Response
) => {
  const { certificateID } = req.params;
  try {
    const responseUser = await CertificateService.getCertificateById(
      certificateID
    );
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser.data);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en getCertificateByIdController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

export const sendCertificationController = async (
  req: Request,
  res: Response
) => {
  const { userID, companyID, certificateIDs, note } = req.body;
  try {
    const responseUser = await CertificateService.sendCertification(
      userID,
      companyID,
      certificateIDs
    );
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser.res);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en certifyWhitCompanyController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

export const updateSentCertificateStatusController = async (
  req: Request,
  res: Response
) => {
  const { certificateRequestID, certificateID, state } = req.body;
  try {
    const responseUser = await CertificateService.updateSentCertificateStatus(
      certificateRequestID,
      certificateID,
      state
    );
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser.res);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en updateSentCertificateStatusController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

export const updateCertifyStateController = async (
  req: Request,
  res: Response
) => {
  const { certificateID, state, note } = req.body;

  try {
    const responseUser = await CertificateService.updateCertifyState(
      certificateID,
      state,
      note
    );
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser.res);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en updateCertifyStateController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

export const getReceivedRequestsByEntityController = async (
  req: Request,
  res: Response
) => {
  const { companyID, page, pageSize } = req.params;
  try {
    const responseUser = await CertificateService.getReceivedRequestsByEntity(
      companyID,
      Number(page),
      Number(pageSize)
    );
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en getReceiverRequestsByEntityController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

export const getSentRequestsByEntityController = async (
  req: Request,
  res: Response
) => {
  const { companyID, page, pageSize } = req.params;
  try {
    const responseUser = await CertificateService.getSentRequestsByEntity(
      companyID,
      Number(page),
      Number(pageSize)
    );
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en getSentRequestsByEntityController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

export const deleteCertificateController = async (
  req: Request,
  res: Response
) => {
  const { certificateID } = req.params;
  try {
    const responseUser = await CertificateService.deleteCertificateByID(
      certificateID
    );
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser.res);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en getSentRequestsByEntityController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

export const resendCertifyController = async (req: Request, res: Response) => {
  const { certificateRequestID, certificateIDs } = req.body;
  console.log(certificateIDs);
  try {
    const responseUser = await CertificateService.resendCertify(
      certificateRequestID,
      certificateIDs
    );
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser.res);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en getSentRequestsByEntityController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

export const updateRequiredDocumentsController = async (
  req: Request,
  res: Response
) => {
  const { companyID, requiredDocuments } = req.body;
  try {
    const responseUser = await CertificateService.updateRequireddDocuments(
      companyID,
      requiredDocuments
    );
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser.res);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en updateRequiredDocumentsController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

export const getRequiredDocuments = async (req: Request, res: Response) => {
  try {
    const { companyID } = req.params;
    const responseUser = await CertificateService.getRequiredDocuments(
      companyID
    );
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser.data);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en getRequiredDocumentsController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

export const verifyCertificationController = async (
  req: Request,
  res: Response
) => {
  const { userID, CompanyID } = req.params;
  try {
    const responseUser = await CertificateService.verifyCertification(
      userID,
      CompanyID
    );
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en verifyCertificationController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};
