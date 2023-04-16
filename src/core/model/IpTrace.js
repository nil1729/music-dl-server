const mongoose = require('mongoose');
const { Schema } = mongoose;
const { Types } = Schema;

const IpTraceSchema = new Schema(
  {
    ip: {
      type: Types.String,
      required: true,
      unique: true,
    },
    coordinates: {
      lat: {
        type: Types.Number,
        required: true,
      },
      lng: {
        type: Types.Number,
        required: true,
      },
    },
    country: {
      type: Types.String,
      required: true,
    },
    country_code: {
      type: Types.String,
      required: true,
    },
    region: {
      type: Types.String,
    },
    region_code: {
      type: Types.String,
    },
    isp: {
      type: Types.String,
    },
    timezone: {
      type: Types.String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('IpTrace', IpTraceSchema);
