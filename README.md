# Route Planner

## Description
Route Planner is a web application that enables users to plan, save, and share hiking and running routes. Users can create routes by drawing on an interactive map or entering addresses, view route details (distance, elevation, country, etc.), and interact with the community through comments and ratings.

## Built With
<img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5 icon" />
<img src="https://img.shields.io/badge/CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS icon" />
<img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript icon" />
<img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python icon" />
<img src="https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Flask icon" />
<img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite icon" />
<img src="https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white" alt="Leaflet icon" />
<img src="https://img.shields.io/badge/OpenRouteService-FF6F00?style=for-the-badge&logo=OpenStreetMap&logoColor=white" alt="OpenRouteService icon" />

## Decisions and Some Considerations
- **Flask** was chosen for its simplicity and flexibility in building RESTful backends with Python.
- **SQLite** is used as the database for its ease of setup and suitability for lightweight web apps.
- **Leaflet.js** provides an interactive, customizable map experience for route creation.
- **OpenRouteService (ORS)** and **Nominatim** are used for realistic routing, geocoding, and reverse geocoding.
- **Tailwind CSS** allows for rapid, responsive, and modern UI development.
- **python-dotenv** is used to securely manage API keys and sensitive configuration.
- **StaticMap & Pillow** are used to generate static map images for route visualization.
- Only key route points (start, waypoints, end) are stored in the database for efficiency; full geometry is generated on demand.
- User authentication and session management are implemented with Flask-Login.
- Community features (comments, ratings) foster engagement and feedback.
- The codebase and UI are designed to be mobile-friendly and accessible.

## Features
- **Create and save routes** by drawing on a map or entering addresses
- **Realistic routing** with distance and elevation metrics
- **Static map image** generation for each route
- **View route details** (distance, elevation gain/loss, country, etc.)
- **Comment and rate routes** (community features)
- **User authentication** (register, login, profile)
- **Responsive design** for desktop and mobile
- **Share and export routes** (future feature)
- **Search for locations** directly on the map (future feature)

## Diagrams

### Entity Relationship Diagram (ERD)
<!-- Add your ER diagram image here -->


### Sequence Diagram
<!-- Add your sequence diagram image here -->


## Getting Started

### Prerequisites
- Python 3.8+
- Node.js (for frontend build, optional)
- [OpenRouteService API key](https://openrouteservice.org/sign-up/)
- [Nominatim](https://nominatim.org/) (used via public API)

### Installation
