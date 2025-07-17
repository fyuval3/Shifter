# Shifter - Military Shift Scheduling App

**Shifter** is a comprehensive Hebrew RTL web application for military units to efficiently manage guard posts, soldiers, and shift schedules. Built with Next.js, it streamlines guard duty assignments while ensuring proper rest periods and fair distribution.

## 📖 Table of Contents

- [🎯 Purpose](#-purpose)
- [✨ Key Features](#-key-features)
- [🚀 Getting Started](#-getting-started)
- [🎮 Usage](#-usage)
- [🏗️ Built With](#️-built-with)
- [🚢 Deployment](#-deployment)

## 🎯 Purpose

Shifter solves military guard duty scheduling with an intuitive interface for:
- Managing guard posts with specific requirements and active hours
- Organizing soldiers into color-coded groups
- Creating optimized shift schedules with drag-and-drop functionality
- Ensuring proper rest periods and conflict detection
- Exporting schedules in multiple formats

## ✨ Key Features

### 📋 Interface & Management
- **Three-Tab Layout**: Schedule, Posts, and Soldiers management
- **Group Organization**: 8 color-coded soldier groups with drag-and-drop reordering
- **Modal-Based Editing**: Streamlined soldier and post configuration
- **Hebrew RTL Support**: Fully localized interface

### 📅 Advanced Scheduling
- **Interactive Schedule Table**: Visual time-slot based assignment grid
- **Smart Drag-and-Drop**: Soldier swaps, group assignments, and reordering
- **Auto-Fill & Shuffle**: Automatic schedule population with fair distribution
- **Real-Time Validation**: Instant feedback on conflicts and rest violations
- **Schedule Tools**: Compression, highlighting, and conflict detection

### 🔧 Technical Features
- **Responsive Design**: Desktop and mobile support
- **Configurable Time Slots**: 30-minute, 1-hour, or 2-hour granularity
- **Data Persistence**: Local storage (no external dependencies)
- **Export Options**: Time-first or post-first formats with customization

## 🚀 Getting Started

### Option 1: Docker Deployment (Recommended)

```bash
# Clone and run
git clone https://github.com/fyuval3/Shifter.git
cd shifter-app
docker-compose up -d
```

Open [http://localhost:3000](http://localhost:3000)

### Option 2: Local Development

```bash
# Install and run
npm install
npm run dev
```

**Prerequisites**: Node.js 18+, Docker (for Option 1)

## 🎮 Usage

1. **Setup**: Define guard posts and add soldiers to color-coded groups
2. **Schedule**: Use drag-and-drop to assign soldiers or auto-fill for optimal distribution
3. **Validate**: Review warnings for rest periods and scheduling conflicts
4. **Export**: Generate formatted schedules for distribution

## 🏗️ Built With

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Docker** - Containerization

## 🚢 Deployment

### Production Options
- **Cloud**: AWS, Google Cloud, Azure with Docker
- **Local**: Docker Compose for simple deployment
- **Kubernetes**: Container orchestration support

### Security
- Client-side only (no backend database)
- Browser localStorage for data
- Network isolation compatible
- Suitable for military environments

---

*Designed for military units requiring efficient guard duty scheduling with Hebrew interface support.*
