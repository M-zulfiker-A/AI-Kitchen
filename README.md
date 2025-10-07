# 🍳 AI-Kitchen

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🏗️ Project Structure

```
AI-Kitchen/
├── backend/               # Backend server and API
│   ├── routes/           # API route handlers
│   ├── services/         # Business logic and services
│   ├── uploads/          # User-uploaded files
│   ├── app.py            # FastAPI application setup
│   ├── config.py         # Configuration settings
│   ├── main.py           # Application entry point
│   └── requirements.txt  # Python dependencies
└── frontend/             # React-based web interface
    ├── public/           # Static assets
    └── src/              # React application source
        ├── components/   # Reusable UI components
        └── lib/          # Utility functions and API clients
```

## 🛠️ Installation

### Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn
- OpenAI API key

### Backend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/M-zulfiker/AI-Kitchen.git
   cd AI-Kitchen/backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

5. Start the backend server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## 🌐 API Documentation

Once the backend server is running, you can access the interactive API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with FastAPI and React
- Powered by OpenAI's language models
- Icons by [Feather Icons](https://feathericons.com/)

## 📧 Contact

For any questions or feedback, please open an issue or contact the project maintainers.
