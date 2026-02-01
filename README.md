# 🌌 UniVerse AI

> **The Next Generation of AI-Powered Learning**  
> *Advanced Educational Content Generator with Multi-LLM Intelligence & Futuristic Design*

[![MCA Project](https://img.shields.io/badge/Project-MCA_Final_Year-blue?style=for-the-badge&logo=academic)](https://github.com/Vrushi0912/UniVerse-AI)
[![Tech Stack](https://img.shields.io/badge/Stack-Flask_MongoDB_JS-teal?style=for-the-badge&logo=python)](https://github.com/Vrushi0912/UniVerse-AI)
[![AI Powered](https://img.shields.io/badge/AI-Grok_%7C_Gemini-purple?style=for-the-badge&logo=openai)](https://github.com/Vrushi0912/UniVerse-AI)
[![Status](https://img.shields.io/badge/Status-Active_Development-success?style=for-the-badge)](https://github.com/Vrushi0912/UniVerse-AI)

---

## 🚀 Overview

**UniVerse AI** is a cutting-edge educational platform designed to revolutionize how students and educators generate, organize, and consume learning material. Unlike simple wrapper applications, UniVerse AI features a robust **Micro-App Architecture** maximizing modularity and scalability.

By combining the reasoning capabilities of **xAI's Grok** and **Google's Gemini**, the platform delivers high-fidelity educational content, dynamic visualizations, and personalized learning experiences—all wrapped in a stunning, industry-leading **Glassmorphism UI**.

## ✨ Key Features & Enhancements

### 🧠 Dual-Core AI Engine
- **Multi-Model Intelligence**: Seamlessly switches between **Grok-2** (for complex reasoning) and **Gemini 1.5 Pro** (for speed and creative tasks).
- **Context-Aware Generation**: Produces structured lessons, quizzes, and summaries tailored to user expertise levels.
- **Visual Learning**: Auto-generates interactive flowcharts and diagrams using **Mermaid.js**.

### 🎨 Premium User Experience (UX)
- **Futuristic Interface**: A completely redesigned UI featuring **Glassmorphism**, neon aesthetics, and fluid micro-interactions.
- **"Live" State System**: Real-time visual feedback for all user actions (saving, generating, errors).
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop environments.
- **Accessibility**: High-contrast modes and screen-reader friendly structure.

### 📚 Intelligent Library System
- **Smart Organization**: Save generated prompts and results with automatic tagging and categorization.
- **Advanced Search**: Full-text search across all saved history with filters for date, topic, and tags.
- **Cross-Device Sync**: Your library follows you everywhere, powered by a centralized **MongoDB** cloud database.

### 🔐 Enterprise-Grade Security
- **JWT Authentication**: Secure, stateless user sessions with automatic expiration and refresh.
- **Encrypted Storage**: Sensitive user preferences and API keys are encrypted at rest.
- **Role-Based Access**: Granular permission systems for different user tiers.

## 🛠️ Technology Stack

| Domain | Technologies |
|--------|--------------|
| **Frontend** | HTML5, Modern CSS3 (Variables, Grid, Flexbox), Vanilla JavaScript (ES6+), Mermaid.js |
| **Backend** | Python 3.9+, Flask (REST API), PyJWT, Bcrypt |
| **Database** | MongoDB (Atlas Cloud Clusters / Local Fallback) |
| **AI Integration** | xAI API (Grok), Google Generative AI (Gemini) |
| **DevOps** | Git, Docker (Ready), Pytest (TDD) |

## 📂 Project Architecture

The project has been restructured for scalability and maintainability, following professional software engineering standards:

```
UniVerse-AI/
├── backend/                # Server-side logic
│   ├── app/               # Application factory & blueprints
│   ├── database/          # Database connection & models
│   └── scripts/           # Migration & utility scripts
├── frontend/               # Client-side presentation
│   ├── css/               # Modular CSS files (Component-based)
│   ├── js/                # Modular JavaScript (ES modules)
│   └── assets/            # Static media
├── docs/                   # Comprehensive documentation
├── tests/                  # Automated test suite (Pytest)
└── requirements.txt        # Dependency management
```

## ⚡ Getting Started

### Prerequisites
- Python 3.8 or higher
- MongoDB (Local installation or Atlas URI)
- Node.js (optional, for frontend toolchain if extended)

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Vrushi0912/UniVerse-AI.git
   cd UniVerse-AI
   ```

2. **Set Up Virtual Environment**
   ```bash
   python -m venv venv
   # Windows
   .\venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Configuration**
   - Copy `.env.example` to `.env`
   - Fill in your API keys (Grok/Gemini) and MongoDB URI.
   ```bash
   cp .env.example .env
   ```

5. **Initialize Database**
   ```bash
   python backend/database/setup_indexes.py
   ```

6. **Run the Application**
   ```bash
   # Using the helper script (Windows)
   .\start.ps1
   
   # OR manally
   python main.py
   ```

## 🧪 Testing

We maintain a high standard of code quality with a comprehensive test suite covering API endpoints, database operations, and security mechanisms.

```bash
# Run all tests
pytest tests/ -v
```

## 📖 Documentation

Detailed documentation is available in the `/docs` directory:
- [**Deployment Guide**](docs/DEPLOYMENT_QUICKSTART.md)
- [**Database Schema**](docs/DATABASE_QUICKSTART.md)
- [**API Documentation**](docs/IMPLEMENTATION_GUIDE.md)

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](docs/CONTRIBUTING.md) before submitting a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <b>Developed with ❤️ by Vrushket Mulye</b><br>
  <i>MCA Final Year Project 2025</i>
</div>
