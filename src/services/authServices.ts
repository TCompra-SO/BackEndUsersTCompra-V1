import { Auth } from "../interfaces/auth.interface";
import { UserTest } from "../interfaces/userTest.interface";
import UserTestModel from "../models/userTestModel";
import { encrypt, verified } from "../utils/bcrypt.handle";
import { generateToken } from "../utils/jwt.handle";

const registerNewUser = async ({ email, password, name }: UserTest) => {
  const checkIs = await UserTestModel.findOne({ email });
  if (checkIs) return "ALREADy_USER";
  const passHash = await encrypt(password);
  const registerNewUser = await UserTestModel.create({
    email,
    password: passHash,
    name,
  });

  return registerNewUser;
};

const loginUser = async ({ email, password }: Auth) => {
  const checkIs = await UserTestModel.findOne({ email });
  if (!checkIs) return "NOT_FOUND_USER";
  const passwordHash = checkIs.password;
  const isCorrect = await verified(password, passwordHash);
  if (!isCorrect) return "PASSWORD_INCORRECT";
  const token = generateToken(checkIs.email);
 
  const data = {
    token,
    user: checkIs,
  };
  return token;
};

export { registerNewUser, loginUser };
