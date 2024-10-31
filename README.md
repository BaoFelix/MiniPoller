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

Configuration
.env Configuration
To set up the environment variables, create a .env file in the backend directory with the following content:

PORT=3000
HOST=0.0.0.0
HTTPS_ENABLED=false
SSL_KEY_PATH=path/to/your/server.key
SSL_CERT_PATH=path/to/your/server.cert
PORT: The port on which the server will run.
HOST: The host address for the server.
HTTPS_ENABLED: Set to true to enable HTTPS, otherwise false.
SSL_KEY_PATH: The file path to your SSL key.
SSL_CERT_PATH: The file path to your SSL certificate.
Using Public Network IP
To connect to the internet using a public network IP instead of the local network by default, set the HOST variable in the .env file to your public IP address:

HOST=your.public.ip.address
Setting Up SSL for HTTPS
To set up SSL for HTTPS, ensure HTTPS_ENABLED is set to true and provide the paths to your SSL key and certificate in the .env file:

HTTPS_ENABLED=true
SSL_KEY_PATH=path/to/your/server.key
SSL_CERT_PATH=path/to/your/server.cert

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License
This project is licensed under the MIT License and Open Font License.

---
Feel free to review this draft and suggest any changes or additional sections you'd like to include.
