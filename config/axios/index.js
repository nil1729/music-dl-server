/*jshint esversion: 11 */

const Axios = require('axios');
const { MAX_API_TIMEOUT } = require('../env');

async function getAxiosResponse(url, responseType = 'json', timeout = MAX_API_TIMEOUT) {
  try {
    const response = await Axios.get(url, {
      responseType: responseType,
      timeout: timeout,
    });
    return response.data;
  } catch (e) {
    // TODO: handle the error
    console.log(e);
  }
}

async function sendAxiosRequest(url, requestBody, timeout = MAX_API_TIMEOUT) {
  try {
    const response = await Axios.post(url, requestBody, { timeout: timeout });
    return response.data;
  } catch (e) {
    console.debug(e);
    throw new Error(e.message);
  }
}

async function sendCustomAxiosRequest(
  method,
  url,
  requestBody,
  headers = {},
  timeout = MAX_API_TIMEOUT
) {
  try {
    const config = {
      method: method,
      maxBodyLength: Infinity,
      url: url,
      headers: headers,
      data: JSON.stringify(requestBody),
      timeout: timeout,
    };
    const response = await Axios.request(config);
    return response.data;
  } catch (e) {
    // TODO: handle the error
    console.debug(e);
    throw new Error(e.message);
  }
}

async function getAuthenticatedResponse(url, token, timeout = MAX_API_TIMEOUT) {
  try {
    const response = await Axios.get(url, {
      timeout: timeout,
      headers: {
        Authorization: 'Bearer ' + token,
      },
    });
    return response.data;
  } catch (e) {
    // TODO: handle the error
    console.log(e);
  }
}

module.exports = {
  getAxiosResponse,
  getAuthenticatedResponse,
  sendAxiosRequest,
  sendCustomAxiosRequest,
};
