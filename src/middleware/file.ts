import fs from "fs";
import path from "path";

// Verifica si la carpeta existe y si no, la crea
const PATH_STORAGE = path.resolve(`${process.cwd()}/uploads`);
if (!fs.existsSync(PATH_STORAGE)) {
  fs.mkdirSync(PATH_STORAGE, { recursive: true });
}
