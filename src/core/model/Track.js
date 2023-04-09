const mongoose = require('mongoose');
const { Schema } = mongoose;
const { Types } = Schema;

const TrackSchema = new Schema(
  {
    track_id: {
      type: Types.String,
      required: true,
      unique: true,
    },
    name: {
      type: Types.String,
      required: true,
    },
    spotify_url: {
      type: Types.String,
      required: true,
    },
    album: {
      type: Types.ObjectId,
      ref: 'Album',
    },
    artists: [
      {
        type: Types.ObjectId,
      },
    ],
    duration: {
      type: Types.Number, // in ms
      required: true,
      default: 0,
    },
    explicit: {
      type: Types.Boolean,
      required: true,
      default: false,
    },
    preview_url: {
      type: Types.String,
    },
    popularity: {
      type: Types.Number,
      required: true,
      default: 50,
    },

    // music-dl-props
    music_dl_downloaded: {
      type: Types.Boolean,
      required: true,
      default: false,
    },
    music_dl_hit: {
      type: Types.Number,
      required: true,
      default: 0,
    },
    music_dl_download_count: {
      type: Types.Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Track', TrackSchema);
