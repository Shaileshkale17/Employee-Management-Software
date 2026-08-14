class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something  went wrong",
    error = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.error = error;
    this.data = null;
    this.success = false;
    Object.defineProperty(this, "message", {
      value: message,
      writable: true,
      enumerable: true,
      configurable: true,
    });
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
