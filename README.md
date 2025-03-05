# TranDaDan - Docker Edition

## Overview

TranDaDan is a web application built with Django for the backend and React for the frontend. This project is designed to provide a seamless user experience with real-time features, leveraging WebSockets for chat functionality and a PostgreSQL database for data storage. The application is containerized using Docker, making it easy to deploy and manage.

## Features

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
   - Frontend: [http://localhost](http://localhost)
   - Backend API: [http://localhost/api](http://localhost/api)

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

## Deployment

For deployment instructions, refer to the [Deployment Guide](#).

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/YourFeature`).
3. Make your changes and commit them (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature/YourFeature`).
5. Open a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Django](https://www.djangoproject.com/)
- [React](https://reactjs.org/)
- [Docker](https://www.docker.com/)
- [PostgreSQL](https://www.postgresql.org/)

