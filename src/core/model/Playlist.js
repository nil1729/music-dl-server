const mongoose = require('mongoose');
const { Schema } = mongoose;
const { Types } = Schema;

const PlaylistSchema = new Schema(
  {
    playlist_id: {
      type: Types.String,
      required: true,
      unique: true,
    },
    name: {
      type: Types.String,
      required: true,
    },
    description: {
      type: Types.String,
    },
    spotify_api_url: {
      type: Types.String,
      required: true,
    },
    spotify_app_url: {
      type: Types.String,
      required: true,
    },
    followers_count: {
      type: Types.Number,
      required: true,
      default: 0,
    },
    images: [
      {
        height: { type: Types.Number },
        width: { type: Types.Number },
        url: { type: Types.String },
      },
    ],
    snapshot_id: {
      type: Types.String,
      required: true,
    },
    track_count: {
      type: Types.Number,
      required: true,
    },

    // music-dl-props
    music_dl_hit: {
      type: Types.Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Playlist', PlaylistSchema);
