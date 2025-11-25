
export const sendSuccess = (
  res,
  data,
  message = "Operação realizada com sucesso",
  statusCode = 200,
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};