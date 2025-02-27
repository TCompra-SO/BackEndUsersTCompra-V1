import mongoose, { Schema, Document } from "mongoose";
import ShortUniqueId from "short-unique-id";
import { CertificateRequestI } from "../interfaces/certificateRequest.interface";
import { CertificationState } from "../interfaces/certificate.interface";
import { url } from "inspector";
import { required } from "joi";
const uid = new ShortUniqueId({ length: 20 });
// Definir el esquema de los certificados dentro de una solicitud
const CertificateRequestSchema: Schema = new Schema<CertificateRequestI>(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
      default: () => uid.rnd(),
    },
    certificates: [
      {
        uid: {
          type: String,
          required: true, // Este es el UID del certificado
        },
        name: {
          type: String,
          required: true,
        },
        documentName: {
          type: String,
          required: true,
        },
        state: {
          type: Number, // O usa `String` si el estado es un string
          required: true, // El estado es requerido
        },
        url: {
          type: String,
          required: true,
        },
        creationDate: {
          type: Date,
          required: true,
        },
      },
    ],
    state: {
      type: Number,
      required: true,
    },
    receiverEntityID: {
      type: String,
      required: true,
    },
    sendByentityID: {
      type: String,
      required: true,
    },
    note: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

const CertificateRequestModel = mongoose.model<CertificateRequestI>(
  "CertificateRequest",
  CertificateRequestSchema
);

export default CertificateRequestModel;
