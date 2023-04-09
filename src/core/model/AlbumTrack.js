const mongoose = require('mongoose');
const { Schema } = mongoose;
const { Types } = Schema;

const AlbumTrackMapSchema = new Schema(
  {
    track_id: {
      type: Types.ObjectId,
      required: true,
      ref: 'Track',
    },
    album_id: {
      type: Types.ObjectId,
      required: true,
      ref: 'Album',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AlbumTrack', AlbumTrackMapSchema);
