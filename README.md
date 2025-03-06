# TranDaDan - Docker Edition

## Overview

TranDaDan is an innovative web application designed to enhance social interaction through real-time communication. Built with a robust Django backend and a dynamic React frontend, this project aims to provide users with a seamless experience for chatting, sharing, playing, and connecting with others.

### Project Purpose

In today's fast-paced digital world, effective communication is essential. TranDaDan addresses this need by offering a platform where users can engage in real-time conversations, share multimedia content, and stay connected with friends and family. The application is particularly focused on:

- **Real-Time Messaging**: Utilizing WebSockets, TranDaDan allows users to send and receive messages instantly, creating a chat experience that feels immediate and engaging.
- **User-Centric Design**: The frontend is crafted with React, ensuring a responsive and intuitive user interface that adapts to various devices, from desktops to mobile phones.
- **Secure User Authentication**: The application implements secure user registration and login processes, ensuring that user data is protected and private.
- **Scalability and Performance**: By leveraging Docker for containerization, TranDaDan is designed to be easily deployable and scalable, making it suitable for both small groups and larger communities.

### Key Features

- **Real-time Chat**: Users can send and receive messages instantly.
- **User Authentication**: Secure user registration and login.
- **Responsive Design**: Optimized for both desktop and mobile devices.
- **Dockerized**: Easy to set up and deploy using Docker and Docker Compose.
- **PostgreSQL Database**: Reliable data storage with PostgreSQL.

## Technologies Used

- **Backend**: Django, Django Channels, PostgreSQL
- **Frontend**: React, Vite
- **Containerization**: Docker, Docker Compose
- **Web Server**: Nginx
- **Real-time Communication**: WebSockets

## Getting Started

### Prerequisites

- Docker
- Docker Compose
- Git

### Installation

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd <your-project-directory>
   ```

2. **Create a `.env` file** in the root directory and add your environment variables:
   ```env
   POSTGRES_USER=your_user
   POSTGRES_PASSWORD=your_password
   POSTGRES_DB=your_db
   POSTGRES_HOST=postgres
   POSTGRES_PORT=5432
   ```

3. **Build and run the application**:
   ```bash
   docker-compose up -d --build
   ```

4. **Access the application**:
   -[https://localhost](https://localhost)

### Running Migrations

To set up the database, run the following commands:
```bash
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate
```

### Seeding the Database

To seed the database with initial data, run:
```bash
docker-compose exec backend python manage.py seed_users
docker-compose exec backend python manage.py seed_match
```

### Stopping the Application

To stop the application, run:
```bash
docker-compose down
```

## Makefile

The Makefile provides a set of convenient commands to manage the Docker containers and the application lifecycle. Here are the available commands:

- **up**: Build and start the application in detached mode.
  ```bash
  make up
  ```

- **down**: Stop and remove the application containers.
  ```bash
  make down
  ```

- **logs**: View the logs of the application containers in real-time.
  ```bash
  make logs
  ```

- **build**: Build the application containers.
  ```bash
  make build
  ```

- **stop**: Stop the application containers without removing them.
  ```bash
  make stop
  ```

- **clean**: Remove unused Docker resources, including volumes and networks.
  ```bash
  make clean
  ```

## Deployment

For deployment instructions, refer to the [Deployment Guide](#).

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/YourFeature`).
3. Make your changes and commit them (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature/YourFeature`).
5. Open a pull request.

DEMO: https://trandadan.live/

