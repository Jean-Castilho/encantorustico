import { GeneralError, ValidationError } from "../errors/customErrors.js";

// This will be our simple logger for now
const logError = (err) => {
  console.error(
    JSON.stringify(
      {
        level: "error",
        name: err.name,
        message: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined, // Only show stack in dev
        timestamp: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
};

const handleErrors = (err, req, res, next) => {
  // Log the error first
  logError(err);

  // Se for um erro de validação, inclua os detalhes dos campos
  if (err instanceof ValidationError) {
    return res.status(err.getCode()).json({
      success: false,
      message: err.message,
      errors: err.errors, // Adiciona o array de erros na resposta
    });
  }

  if (err instanceof GeneralError) {
    return res.status(err.getCode()).json({
      success: false,
      message: err.message
    });
  }

  // For unexpected errors
  return res.status(500).json({
    success: false,
    message: "Ocorreu um erro inesperado no servidor.",
  });
};

export default handleErrors;
