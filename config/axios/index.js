/*jshint esversion: 11 */

const Axios = require('axios');
const { MAX_API_TIMEOUT } = require('../env');

async function getAxiosResponse(url, responseType, timeout = MAX_API_TIMEOUT) {
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
    // TODO: handle the error
    console.log(e);
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

module.exports = { getAxiosResponse, getAuthenticatedResponse, sendAxiosRequest };
