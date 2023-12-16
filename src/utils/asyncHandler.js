const asyncHandler = (requestHandler) => {
  /*
  higher order function , used for error handling and 
  avoid using try and catch blocks and if any error 
  occurs they pass the error to thhe next
  middleware for handling that error
  */
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };

// const asyncHandler = (fn) => async (req, res, next) => {
//   try {
//     await fn(req, res, next);
//   } catch (error) {
//     res.status(err.code || 500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };
