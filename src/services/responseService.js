
export const sendSuccess = (
  res,
  data,
  mensagem = "Operação realizada com sucesso",
  statusCode = 200,
) => {
  return res.status(statusCode).json({
    success: true,
    mensagem,
    data,
  });
};