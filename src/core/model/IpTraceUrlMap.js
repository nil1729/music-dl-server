const mongoose = require('mongoose');
const { Schema } = mongoose;
const { Types } = Schema;

const IpTraceUrlMapSchema = new Schema(
  {
    ip_trace_id: {
      type: Types.ObjectId,
      required: true,
      ref: 'Track',
    },
    url: {
      type: Types.String,
      required: true,
    },
    request_count: {
      type: Types.Number,
      default: 1,
    },
  },
  { timestamps: true }
);

IpTraceUrlMapSchema.index({ ip_trace_id: 1, url: 1 }, { unique: true });

module.exports = mongoose.model('IpTraceUrlMap', IpTraceUrlMapSchema);
