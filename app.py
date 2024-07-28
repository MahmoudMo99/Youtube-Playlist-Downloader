from flask import Flask, request, jsonify, render_template, send_file
from flask_cors import CORS
import yt_dlp
import os
import zipfile

app = Flask(__name__)
CORS(app)

DOWNLOAD_FOLDER = 'downloads'

if not os.path.exists(DOWNLOAD_FOLDER):
    os.makedirs(DOWNLOAD_FOLDER)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/fetch_playlist', methods=['POST'])
def fetch_playlist():
    data = request.get_json()
    playlist_url = data['url']
    quality = data.get('quality', 'best')  # Default to 'best' if quality is not specified

    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'ignoreerrors': True,
        'format': quality,
    }

    video_list = []
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info_dict = ydl.extract_info(playlist_url, download=False)
            for entry in info_dict['entries']:
                if entry is not None:
                    video_list.append({'title': entry.get('title', 'Unknown title'), 'id': entry.get('id')})
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    return jsonify({'videos': video_list})

@app.route('/download_playlist', methods=['POST'])
def download_playlist():
    data = request.get_json()
    playlist_url = data['url']
    quality = data.get('quality', 'best')  # Default to 'best' if quality is not specified

    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'ignoreerrors': True,
        'format': quality,
        'outtmpl': os.path.join(DOWNLOAD_FOLDER, '%(title)s.%(ext)s'),  # Specify download folder
    }

    downloaded_files = []

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info_dict = ydl.extract_info(playlist_url, download=False)
            for entry in info_dict['entries']:
                if entry is not None:
                    try:
                        ydl.download([entry['webpage_url']])
                        downloaded_files.append(os.path.join(DOWNLOAD_FOLDER, f"{entry['title']}.{entry['ext']}"))
                    except Exception as e:
                        print(f"Error downloading {entry['title']}: {e}")
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    # Create a zip file of the downloaded videos
    zip_filename = os.path.join(DOWNLOAD_FOLDER, 'playlist.zip')
    with zipfile.ZipFile(zip_filename, 'w') as zipf:
        for file in downloaded_files:
            zipf.write(file, os.path.basename(file))

    return send_file(zip_filename, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)
