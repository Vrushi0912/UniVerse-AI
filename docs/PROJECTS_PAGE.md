# Projects Page Feature Documentation

## Overview
The **Projects Page** is a comprehensive project management system integrated into UniVerse AI. It allows users to organize their AI-generated code, assets, and ideas into manageable projects. The feature supports multiple view modes (Grid, List, Kanban), lifecycle management (planning to completion), and detailed project tracking.

## Key Features

### 1. **Project Management**
- **Create Projects**: Detailed form with name, description, priority, status, deadline, and tags.
- **Edit/Delete**: Full CRUD capabilities.
- **Status Tracking**: Workflow states include Planning, In Progress, Completed, and On Hold.
- **Priority Levels**: Low, Medium, High, and Urgent (with visual indicators).

### 2. **Multiple Views**
- **Grid View**: Visual card-based layout ideal for browsing.
- **List View**: Dense, detailed list for scanning information.
- **Kanban Board**: Drag-and-drop interface for managing project status workflow.

### 3. **Search & Filter**
- **Real-time Search**: Filter by name, description, or tags.
- **Status Filters**: View projects by specific status.
- **Sorting**: Sort by creation date, name, or priority.

### 4. **Stats Dashboard**
- **Overview Metrics**: Total projects, active, completed, and on-hold counts.
- **Visual Feedback**: Colorful headers and badges.

## Technical Implementation

### **Frontend**
- **Files**:
  - `frontend/projects.html`: Main structure.
  - `frontend/css/projects.css`: Modern styling with glassmorphism and animations.
  - `frontend/js/projects.js`: Project logic, view switching, and drag-and-drop handlers.
- **Tech Stack**:
  - Vanilla JavaScript (ES6+)
  - CSS3 with CSS Variables & Flexbox/Grid
  - Native Drag & Drop API for Kanban

### **Backend API**
- **Endpoints**:
  - `GET /api/projects`: Fetch all user projects.
  - `GET /api/projects/{id}`: Fetch single project details.
  - `POST /api/projects`: Create new project.
  - `PUT /api/projects/{id}`: Update existing project.
  - `DELETE /api/projects/{id}`: Remove project.
- **Database**:
  - MongoDB collection `projects`
  - User-scoped data (requires authentication)

### **Data Structure**
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "name": "Project Name",
  "description": "Project details...",
  "status": "planning",     // planning, in-progress, completed, on-hold
  "priority": "medium",     // low, medium, high, urgent
  "technology": "React, Node",
  "deadline": "2024-12-31",
  "tags": "web, ai",
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```

## Backend Integration
- **Authentication**: Uses `Authorization: Bearer <token>` header.
- **Fallback**: Changes to `localStorage` if backend is unavailable or user is Guest.

## Future Enhancements
- [ ] Export project to GitHub
- [ ] Collaborative editing
- [ ] File attachments
- [ ] Subtasks checklist
- [ ] Timeline view (Gantt chart)
