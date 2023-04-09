const mongoose = require('mongoose');
const { Schema } = mongoose;
const { Types } = Schema;

const AlbumSchema = new Schema(
  {
    album_id: {
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
    popularity: {
      type: Types.Number,
      required: true,
      default: 50,
    },
    release_date: {
      type: Types.String,
    },
    label: {
      type: Types.String,
    },
    artists: [
      {
        type: Types.ObjectId,
        ref: 'Artist',
      },
    ],
    copyrights: [
      {
        text: { type: Types.String },
        type: { type: Types.String },
      },
    ],
    genres: [
      {
        type: Types.String,
      },
    ],
    images: [
      {
        height: { type: Types.Number },
        width: { type: Types.Number },
        url: { type: Types.String },
      },
    ],
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

module.exports = mongoose.model('Album', AlbumSchema);
