# ReminderCal Project Prompt

Build a modern web application called "ReminderCal".

## Project Overview

ReminderCal is a reminder and birthday notification platform where users can:

* Create reminders for specific dates and times.
* Receive email notifications when reminders are due.
* Manage birthday reminders.
* Automatically send birthday wishes every year.
* View reminders on a calendar dashboard.
* Manage upcoming reminders from a sidebar.

## Technology Stack

Frontend:

* HTML5
* CSS3
* Vanilla JavaScript

Backend:

* Python FastAPI

Database:

* PostgreSQL

Infrastructure:

* Docker
* Docker Compose

Reverse Proxy:

* Nginx

CI/CD:

* GitLab CI/CD

Monitoring:

* Prometheus
* Grafana
* Node Exporter
* cAdvisor
* Alertmanager

## Frontend Requirements

The UI should have:

### Navigation Bar

* ReminderCal logo
* Dashboard menu
* Reminders menu
* Settings menu
* User profile section

### Dashboard Banner

Display a notification section:

"Never Miss an Important Date"

with a modern card design.

### Sidebar

Contains:

* Create Reminder button
* Upcoming Reminders list
* Birthday Reminders section

### Calendar

Features:

* Monthly view
* Previous Month button
* Next Month button
* Today highlight
* Event badges
* Responsive layout

### Modal

Create Reminder popup with:

* Reminder title
* Reminder description
* Reminder category
* Date
* Time
* Save button
* Cancel button

## Reminder Features

Each reminder contains:

* id
* title
* description
* category
* date
* time
* created_at

Categories:

* Work
* Personal
* Birthday
* Finance
* Health

## Birthday Module

User can add:

* Person Name
* Email Address
* Date of Birth

System should automatically generate birthday reminders yearly.

## Backend APIs

POST /reminders

GET /reminders

GET /reminders/{id}

PUT /reminders/{id}

DELETE /reminders/{id}

POST /birthdays

GET /birthdays

## Database Schema

Users

Reminders

Birthdays

NotificationLogs

## Authentication

Future-ready authentication system:

* Registration
* Login
* JWT Tokens

## Docker Requirements

Containers:

* frontend
* backend
* postgres
* nginx

Docker Compose should start the entire stack.

## Monitoring Requirements

Prometheus should monitor:

* Linux server metrics
* Docker metrics
* Backend API metrics

Grafana dashboards should show:

* CPU Usage
* Memory Usage
* Disk Usage
* Container Status
* Reminder API Response Time

## Alerting Requirements

Alertmanager should send alerts when:

* Backend container is down
* CPU usage exceeds 80%
* Memory usage exceeds 80%
* Disk usage exceeds 90%

## UI Design Requirements

Design style:

* Modern SaaS dashboard
* White background
* Blue accent colors
* Rounded corners
* Soft shadows
* Responsive design
* Professional appearance similar to Google Calendar, Notion, and modern productivity applications

## Project Structure

frontend/
│
├── css/
├── js/
├── assets/
└── index.html

backend/
│
├── routes/
├── models/
├── database/
├── services/
└── main.py

monitoring/
│
├── prometheus/
├── grafana/
└── alertmanager/

The code should follow clean architecture principles, be modular, production-ready, and easy to maintain.
