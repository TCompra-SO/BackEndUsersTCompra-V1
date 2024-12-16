import mongoose, { Schema, Types, model, Model } from "mongoose";
import ShortUniqueId from "short-unique-id";
import { CertificateI, RequestsI } from "../interfaces/certificate.interface";
import { number } from "joi";

const uid = new ShortUniqueId({ length: 20 });

const RequestsSchema = new Schema<RequestsI>({
  receiverEntityID: { type: String, required: true },
  certificateRequestID: { type: String, required: true },
});

const CertificateSchema: Schema = new Schema<CertificateI>({
  uid: {
    type: String,
    required: true,
    unique: true,
    default: () => uid.rnd(),
  },
  name: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  state: {
    type: Number,
    required: true,
  },
  companyID: {
    type: String,
    required: true,
  },
  creationDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  documentName: {
    type: String,
    required: true,
  },
  request: {
    type: [RequestsSchema],
    required: false,
  },
  urlRequest: {
    type: String,
    required: false,
  },
  used: {
    type: Boolean,
    required: false,
  },
});

// Exporta el modelo
const CertificateModel = mongoose.model<CertificateI>(
  "Certificates",
  CertificateSchema
);

export default CertificateModel;
