class SuccessResponse {
  constructor(message, data) {
    this.message = message;
    this.data = data;
  }
  getJson() {
    return {
      success: true,
      message: this.message,
      data: this.data,
    };
  }
}

module.exports = SuccessResponse;
