# Music-Dl

`music-dl-server` is a backend server that serves as a Spotify song downloader. It provides two main APIs: one for retrieving metadata about tracks, albums, or playlists, and another for downloading songs. The server utilizes Spotify's API to fetch metadata and performs a reverse search on YouTube to find and download the requested song.

## Goal

The `music-dl-server` is a backend server that I developed specifically to integrate with a mobile application. It provides a set of APIs that allow the mobile app to retrieve metadata about tracks, albums, or playlists from Spotify, as well as download songs from YouTube.

One of the main considerations during development was scalability. I designed the server architecture and implemented features with scalability in mind, ensuring that it can handle increased traffic and user demand as the mobile application grows in popularity. This includes utilizing caching mechanisms to optimize performance and minimize external API calls, as well as implementing IP tracing for logging and analytics purposes.

---

## Features

- **IP Tracing:** The server tracks the IP address of incoming requests, allowing for logging and analytics.
- **Caching:** To optimize performance and reduce external API calls, the server implements caching mechanisms to store retrieved metadata and downloaded songs.

---

## APIs

The `music-dl-server` exposes the following APIs:

### Metadata API

Endpoint: `/api/spotify/metadata?link={{spotify_link}}`

This API allows you to retrieve metadata about a specific track, album, or playlist by providing its unique identifier. It interacts with Spotify's API to fetch the requested information.

### Download API

Endpoint: `/api/spotify/download/track/{{track_id}}`

This API enables you to download a song by providing its track identifier. The server performs a reverse search on YouTube using the song's name and retrieves the corresponding media file for download.

---

## Usage

To use the `music-dl-server`, follow these steps:

1. Clone the repository

   ```
   git clone https://github.com/nil1729/music-dl-server
   ```

2. Configure environment variables:

   Ensure that you have the following environment variables properly configured:

   - `SPOTIFY_CLIENT_ID`: Your Spotify application client ID.
   - `SPOTIFY_CLIENT_SECRET`: Your Spotify application client secret.
   - `MUSIC_DL_BUCKET_NAME`: a dummy github repo where you want to store downloaded songs (see `\_local/docker.env.sample`)
   - `MUSIC_DL_STORAGE_ACCESS_TOKEN`: github access token with push access

   Create `_local/docker.env` file with the content of `_local/docker.env.sample` and configure above env vars

3. Run the application

   ```
   docker compose up -d
   ```

The server will start running on `http://localhost:9999` and **rabbitmq** management portal on `http://0.0.0.0:8888`

---

### Disclaimer

The `music-dl-server` is intended for personal use only and should comply with the terms and conditions of the Spotify and YouTube platforms.
