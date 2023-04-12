const mongoose = require('mongoose');
const { Schema } = mongoose;
const { Types } = Schema;

const PlaylistTrackMapSchema = new Schema(
  {
    track_id: {
      type: Types.ObjectId,
      required: true,
      ref: 'Track',
    },
    playlist_id: {
      type: Types.ObjectId,
      required: true,
      ref: 'Playlist',
    },
    added_at: {
      type: Types.Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PlaylistTrack', PlaylistTrackMapSchema);
