export const ErrorMessages = (error: string) => {
  switch (error) {
    case '"password" is required':
      return "La contraseña es requerida";
    case '"email" is required':
      return "El correo es requerido";
    case '"userType" is required':
      return "El tipo de usuario es requerido";
    case '"phone" is required':
      return "El telefono es requerido";
    case '"email" must be a valid email':
      return "Correo electrónico inválido";
    case '"password" length must be at least 6 characters long':
      return "La contraseña debe tener mínimo 6 caracteres";
    case '"email" length must be at least 6 characters long':
      return "El correo debe tener mínimo 6 caracteres";
    default:
      return error;
  }
};
