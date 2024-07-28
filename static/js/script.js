let isFetching = false;
let isDownloading = false;

// Function to toggle loader visibility
function toggleLoader(show) {
  const loader = document.getElementById("loader");
  loader.style.display = show ? "block" : "none";
}

// Function to toggle button states
function toggleButtonStates(disableFetch, disableDownload) {
  document.getElementById("fetchBtn").disabled = disableFetch;
  document.getElementById("downloadBtn").disabled = disableDownload;
}

document.getElementById("fetchBtn").addEventListener("click", function () {
  if (isFetching || isDownloading) {
    return;
  }

  const playlistUrl = document.getElementById("playlistUrl").value;
  const statusDiv = document.getElementById("status");
  const videoList = document.getElementById("videoList");

  if (!playlistUrl) {
    statusDiv.innerHTML =
      '<div class="alert alert-danger">Please enter a playlist URL.</div>';
    return;
  }

  isFetching = true;
  toggleLoader(true); // Show loader
  toggleButtonStates(true, true); // Disable both buttons
  statusDiv.innerHTML =
    '<div class="alert alert-info">Fetching playlist information...</div>';

  fetch("/fetch_playlist", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url: playlistUrl }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        throw new Error(data.error);
      }

      const { videos } = data;

      if (!videos || !Array.isArray(videos)) {
        throw new Error("No videos found in the playlist.");
      }

      videoList.innerHTML = videos
        .map(
          (video, index) =>
            `<li class="list-group-item">
                        ${index + 1}. ${video.title}
                        </li>`
        )
        .join("");

      statusDiv.innerHTML =
        '<div class="alert alert-success">Playlist videos fetched successfully!</div>';
    })
    .catch((error) => {
      statusDiv.innerHTML = `<div class="alert alert-danger">Failed to fetch playlist information. ${error.message}</div>`;
    })
    .finally(() => {
      isFetching = false;
      toggleLoader(false); // Hide loader
      toggleButtonStates(false, isDownloading); // Re-enable fetch button and keep download button disabled if downloading
    });
});

document.getElementById("downloadBtn").addEventListener("click", function () {
  if (isFetching || isDownloading) {
    return;
  }

  const playlistUrl = document.getElementById("playlistUrl").value;
  const quality = document.getElementById("qualitySelect").value;
  const statusDiv = document.getElementById("status");

  if (!playlistUrl) {
    statusDiv.innerHTML =
      '<div class="alert alert-danger">Please enter a playlist URL.</div>';
    return;
  }

  isDownloading = true;
  toggleLoader(true); // Show loader
  toggleButtonStates(true, true); // Disable both buttons
  statusDiv.innerHTML =
    '<div class="alert alert-info">Downloading playlist...</div>';

  fetch("/download_playlist", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url: playlistUrl, quality: quality }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.blob();
    })
    .then((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "playlist.zip";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      statusDiv.innerHTML =
        '<div class="alert alert-success">Playlist downloaded successfully!</div>';
    })
    .catch((error) => {
      statusDiv.innerHTML = `<div class="alert alert-danger">Failed to download playlist. ${error.message}</div>`;
    })
    .finally(() => {
      isDownloading = false;
      toggleLoader(false); // Hide loader
      toggleButtonStates(false, false); // Re-enable both buttons
    });
});
