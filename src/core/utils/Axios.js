/*jshint esversion: 11 */

const axios = require('axios');

async function getAxiosResponse(url, responseType, timeout) {
  try {
    const response = await axios.get(url, {
      responseType: responseType,
      timeout: timeout,
    });
    return response.data;
  } catch (e) {
    // TODO: handle the error
    console.log(e);
  }
}

module.exports = { getAxiosResponse };
