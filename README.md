# CAT Rental Monitoring System

A comprehensive equipment rental monitoring system for Caterpillar that provides real-time insights into equipment status, GPS tracking, usage analytics, maintenance scheduling, and predictive forecasting.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Data Model](#data-model)
- [Components](#components)
- [Getting Started](#getting-started)
- [Development](#development)

## Overview

The CAT Rental Monitoring System is a web-based application designed to help Caterpillar manage their equipment rental operations efficiently. The system provides real-time monitoring of equipment status, GPS tracking with geofencing, usage analytics, maintenance alerts, and demand forecasting to optimize rental operations.

## Features

1. **Dashboard** - Overview of key metrics including total equipment, active rentals, monitored sites, and average utilization
2. **Service Management** - Track equipment maintenance schedules and service history
3. **GPS Tracking** - Real-time location monitoring with geofencing alerts
4. **Usage Analytics** - Detailed equipment utilization statistics and performance metrics
5. **Forecasting** - Predictive analytics for equipment demand and client reliability
6. **Alerts System** - Automated notifications for fuel usage deviations, service requirements, geofence violations, and rental due dates

## Technology Stack

- **Frontend**: React with TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Data Processing**: Custom CSV parsing utilities
- **Date Handling**: date-fns

## Project Structure

```
CAT-rental-monitoring/
├── src/
│   ├── components/        # React components for each feature
│   ├── data/              # CSV data files
│   ├── types/             # TypeScript interfaces
│   ├── utils/             # Utility functions for data processing
│   ├── App.tsx            # Main application component
│   └── main.tsx           # Entry point
├── public/                # Static assets
├── index.html             # HTML template
├── package.json           # Dependencies and scripts
└── tailwind.config.js     # Tailwind CSS configuration
```

## Data Model

The system uses six CSV data files to represent different aspects of the rental operations:

1. **Equipment** - Details about each piece of equipment including type, status, fuel usage, and service periods
2. **Sites** - Rental locations with geofencing information
3. **Rentals** - Current and historical rental agreements
4. **Clients** - Customer information with reliability scores and demand forecasting
5. **Equipment Tracking** - GPS location data for equipment
6. **Maintenance** - Service history and logs

## Components

### Layout (`src/components/Layout.tsx`)
Provides the main application structure with:
- Header with application title
- Navigation sidebar with links to all features
- Main content area for dynamic page rendering

### Dashboard (`src/components/Dashboard.tsx`)
The main overview page displaying:
- Key performance indicators (KPIs)
- Equipment status distribution chart
- Equipment usage by type chart
- Active rentals table with utilization metrics

### Service (`src/components/Service.tsx`)
Maintenance tracking features:
- Service history timeline
- Maintenance schedule based on equipment usage
- Service alerts for upcoming requirements

### GPS (`src/components/GPS.tsx`)
Real-time location monitoring:
- Equipment position visualization
- Geofence violation alerts
- Site overview with violation counts
- Detailed tracking table

### Usage (`src/components/Usage.tsx`)
Equipment utilization analytics:
- Utilization percentage by equipment
- Fuel efficiency tracking
- Performance comparison charts

### Forecasting (`src/components/Forecasting.tsx`)
Predictive analytics dashboard:
- Client reliability scoring
- Demand forecasting models
- Risk assessment visualization

### Alerts (`src/components/Alerts.tsx`)
Centralized alert management:
- Fuel usage deviation notifications
- Service requirement alerts
- Geofence violation warnings
- Rental due date reminders

## Utilities

### Data Loader (`src/utils/dataLoader.ts`)
Imports and parses all CSV data files into TypeScript objects for use throughout the application.

### CSV Parser (`src/utils/csvParser.ts`)
Custom CSV parsing utility that converts CSV text into typed JavaScript objects.

### Calculations (`src/utils/calculations.ts`)
Business logic functions including:
- Distance calculations using Haversine formula
- Alert generation based on business rules
- Equipment utilization calculations

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Adding New Features

1. Create a new component in `src/components/`
2. Add navigation entry in `src/components/Layout.tsx`
3. Register the route in `src/App.tsx`
4. Import required data from `src/utils/dataLoader.ts`

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/Harshit-Agarwal-007/CAT-rental-monitoring)