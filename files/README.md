# VicSam File Hosting

This folder contains the files served by the URL shortener system.

## File Structure

- `download.zip` - ZIP file accessible via `/get`
- `app.exe` - Executable file accessible via `/app`

## Configuration

Configure the file paths in your .env file:

```bash
DOWNLOAD_GET_FILE=files/download.zip
DOWNLOAD_APP_FILE=files/app.exe
```

## Usage

- GET /get - Downloads the ZIP file
- GET /app - Downloads the EXE file

These endpoints provide a simple URL shortener for file hosting.
