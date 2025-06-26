# MiniPoller

Lightweight, web-based polling application that allows team members to cast votes simultaneously.

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Introduction

MiniPoller is a lightweight, web-based polling application designed to facilitate quick and easy decision-making within teams. Users can create polls, cast votes, and view results in real-time.

## Features

- Create and manage polls
- Real-time voting and results
- User-friendly interface

## Installation

To set up the project locally, follow these steps:

1. **Clone the repository:**
    ```bash
    git clone https://github.com/BaoFelix/MiniPoller.git
    cd MiniPoller
    ```

2. **Navigate to the backend directory and install dependencies:**
    ```bash
    cd backend
    npm install
    ```

3. **Start the backend server:**
    ```bash
    npm start
    ```

4. **Open the frontend in a browser:**
    Simply open the `index.html` file located in the `frontend` directory.

## Usage

1. **Creating a Poll:**
    - Open the application in your web browser.
    - Fill in the poll question and options.
    - Click on "Create Poll" to generate a poll link.

2. **Voting:**
    - Share the poll link with team members.
    - Team members can cast their votes using the link.

3. **Viewing Results:**
    - Results are updated in real-time as votes are cast.

## Configuration

### .env Configuration

To set up the environment variables, create a `.env` file in the `backend` directory with the following content:

```plaintext
PORT=3000
HOST=0.0.0.0
HTTPS_ENABLED=false
SSL_KEY_PATH=path/to/your/server.key
SSL_CERT_PATH=path/to/your/server.cert
```

- `PORT`: The port on which the server will run.
- `HOST`: The host address for the server.
- `HTTPS_ENABLED`: Set to `true` to enable HTTPS, otherwise `false`.
- `SSL_KEY_PATH`: The file path to your SSL key.
- `SSL_CERT_PATH`: The file path to your SSL certificate.

### Using Public Network IP

To make the application accessible over the internet via a public IP address:

1. Ensure your server has a public IP address. If your server is behind a router or firewall, you may need to configure port forwarding.
2. Set `HOST` to `0.0.0.0` in your `.env` file. This will allow the server to listen on all available network interfaces, making it accessible both locally and from external networks.

Example .env configuration:

```plaintext
HOST=0.0.0.0
PORT=3000
```

Note: Avoid setting `HOST` directly to your public IP address; setting `0.0.0.0` is sufficient for accepting requests on all interfaces, including your public IP.

### Setting Up SSL for HTTPS

To enable HTTPS for secure communication:

1. Obtain an SSL certificate: You can get a certificate from a trusted Certificate Authority (CA), or generate a self-signed certificate for testing purposes.
2. Configure the `.env` file: Set `HTTPS_ENABLED` to `true`, and specify the paths to your SSL key and certificate files.

Example .env configuration:

```plaintext
HTTPS_ENABLED=true
SSL_KEY_PATH=path/to/your/server.key
SSL_CERT_PATH=path/to/your/server.cert
```

Restart the server after updating the `.env` file for changes to take effect.

Note: For production, use a certificate from a trusted CA to avoid browser security warnings.

## Text Capture Integration (Windows)

The repository includes a lightweight Windows helper located in `windows_capture/ClaptureApp.cpp`.
When compiled, it allows you to select text anywhere on screen and quickly create a poll from it.

### Building the Helper

1. Open the `ClaptureApp.cpp` file in Visual Studio 2022.
2. Build it as a **Win32 Console Application**.
3. Place the resulting `ClaptureApp.exe` in `windows_capture/`.
4. Optional: set the `HOST` and `PORT` environment variables before running the helper to
   specify the MiniPoller backend address. If these are not set, the helper
   defaults to `localhost` and `3000`.

### Using

When you start the backend server on Windows (`npm start` in the `backend` directory),
the helper is launched automatically. Drag to select text and release; a small menu
appears near the cursor. Choose **Create Poll** to open your browser with the
poll question pre-filled. The backend monitors the helper process and will
restart it if it exits unexpectedly. When MiniPoller shuts down (for example by
pressing `Ctrl+C`), the helper is terminated automatically to avoid leaving
orphaned processes running.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License
This project is licensed under the MIT License and Open Font License.

---
Feel free to review this draft and suggest any changes or additional sections you'd like to include.
