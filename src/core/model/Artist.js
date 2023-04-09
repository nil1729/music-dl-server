const mongoose = require('mongoose');
const { Schema } = mongoose;
const { Types } = Schema;

const ArtistSchema = new Schema(
  {
    artist_id: {
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
    popularity: {
      type: Types.Number,
      required: true,
      default: 50,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Artist', ArtistSchema);
