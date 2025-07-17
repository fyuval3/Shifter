# Shifter - Military Shift Scheduling App

**Shifter** is a comprehensive Hebrew RTL web application designed for military units to efficiently manage guard posts, soldiers, and shift schedules. Built with Next.js, this tool streamlines the complex process of organizing guard duty assignments while ensuring proper rest periods and fair distribution of responsibilities.

## 🎯 Purpose

Shifter solves the challenging task of scheduling military guard duty by providing an intuitive interface for:
- Managing guard posts with specific requirements and active hours
- Organizing soldiers into groups with visual color coding
- Creating and optimizing shift schedules with drag-and-drop functionality
- Ensuring proper rest periods between assignments
- Exporting schedules in multiple formats

## ✨ Key Features

### 📋 Three-Tab Interface
- **Schedule Tab**: Interactive schedule table with real-time assignment management
- **Posts Tab**: Guard post configuration and management
- **Soldiers Tab**: Soldier profiles and group organization

### 🎖️ Soldier Management
- **Group Organization**: Assign soldiers to color-coded groups (8 predefined colors)
- **Availability Tracking**: Mark soldiers as available or unavailable for duty
- **Drag-and-Drop Reordering**: Easily reorganize soldiers and groups
- **Modal-Based Editing**: Streamlined soldier profile management

### 🏗️ Guard Post Configuration
- **Flexible Requirements**: Set required number of guards per post
- **Active Hours**: Define when each post is operational
- **Visual Organization**: Clear post management interface

### 📅 Advanced Scheduling
- **Interactive Schedule Table**: Visual time-slot based assignment grid
- **Smart Drag-and-Drop**: Multiple drag operations supported:
  - Soldier-to-soldier swaps within the schedule
  - Soldier-to-group assignments for organization
  - Group-to-group reordering
- **Auto-Fill Functionality**: Automatically populate schedule with fair distribution
- **Shuffle Feature**: Randomize soldier assignments for variety
- **Real-Time Validation**: Instant feedback on scheduling conflicts and rest period violations

### 🔧 Smart Tools
- **Schedule Compression**: Automatically remove gaps in the schedule
- **Rest Period Validation**: Ensure soldiers get adequate rest between shifts
- **Assignment Highlighting**: Visual feedback for soldier assignments
- **Conflict Detection**: Identify scheduling issues and double-bookings

### 📤 Export Options
- **Multiple Formats**: Time-first or post-first organization
- **Customizable Output**: Include/exclude headers, empty slots, and end times
- **Hebrew Support**: Proper RTL text formatting for Hebrew content

## 🛠️ Technical Features

- **Responsive Design**: Works on desktop and mobile devices
- **Real-Time Updates**: Immediate visual feedback for all operations
- **Data Persistence**: Local storage for schedule and configuration data
- **Configurable Time Slots**: 30-minute, 1-hour, or 2-hour scheduling granularity
- **Hebrew RTL Interface**: Fully localized Hebrew interface with proper right-to-left layout

## 🚀 Getting Started

### Option 1: Docker Deployment (Recommended)

The easiest way to run Shifter is using Docker:

#### Prerequisites
- Docker and Docker Compose installed on your system

#### Quick Start
1. Clone the repository:
```bash
git clone <repository-url>
cd shifter-app
```

2. Run with Docker Compose:
```bash
docker-compose up -d
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

#### Manual Docker Build
```bash
# Build the Docker image
docker build -t shifter-app .

# Run the container
docker run -p 3000:3000 shifter-app
```

### Option 2: Local Development

#### Prerequisites
- Node.js (version 18 or higher)
- npm, yarn, pnpm, or bun

#### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

#### Building for Production

```bash
npm run build
npm start
```

## 🎮 Usage

1. **Set Up Posts**: Define your guard posts with required personnel and active hours
2. **Add Soldiers**: Create soldier profiles and organize them into color-coded groups
3. **Create Schedule**: Use the interactive schedule table to assign soldiers to shifts
4. **Optimize**: Use auto-fill, shuffle, and compression tools to perfect your schedule
5. **Validate**: Review warnings for rest period violations and scheduling conflicts
6. **Export**: Generate formatted schedules for distribution

## 🔄 Workflow

The typical workflow involves setting up your organizational structure (posts and soldiers), then using the powerful scheduling tools to create optimal guard duty assignments. The app's intelligent validation ensures that schedules meet military standards for rest periods while the drag-and-drop interface makes adjustments quick and intuitive.

## 🏗️ Built With

- **Next.js 15** - React framework for production
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **React DnD** - Drag and drop functionality
- **Docker** - Containerized deployment
- **Node.js 18** - Runtime environment

## 🚢 Deployment

### Production Deployment with Docker

1. **Cloud Platforms**: Deploy easily on AWS, Google Cloud, Azure, or any Docker-compatible platform
2. **VPS/Server**: Use Docker Compose for simple server deployment
3. **Container Orchestration**: Compatible with Kubernetes for large-scale deployments

### Environment Variables

The app runs without external dependencies and stores data locally in the browser. No additional environment configuration is required for basic operation.

### Security Considerations

- The app runs entirely client-side with no backend database
- All data is stored in browser localStorage
- Suitable for military environments with network restrictions
- Can be deployed on isolated networks

---

*Shifter is designed specifically for military units requiring efficient and reliable guard duty scheduling. The Hebrew interface and military-specific features make it an ideal solution for IDF and other Hebrew-speaking military organizations.*
