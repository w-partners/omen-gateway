# OMEN SERVER GATEWAY with Cloudflare

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)

## 🚀 Overview

OMEN Server Gateway is a comprehensive server management system designed to control and monitor multiple services through a centralized web interface. It integrates with Cloudflare tunnels for secure external access and provides automatic recovery mechanisms for high availability.

## ✨ Features

- **🖥️ Web-based Management Interface**: Intuitive dashboard on port 7777
- **🔄 Server Control**: Start, stop, and monitor multiple services
- **🌐 Cloudflare Integration**: Secure tunnel connections for external access
- **📊 Real-time Monitoring**: Health checks and status updates
- **🔐 Role-based Access Control**: Multiple user levels (super_admin, admin, operator, member)
- **🚦 Auto-startup**: Windows service integration for automatic startup
- **📱 Responsive Design**: Works on desktop and mobile devices
- **🗄️ PostgreSQL Database**: Reliable data persistence

## 🌐 Access Points

### Local Access
- **Management Interface**: http://localhost:7777

### External Access (via Cloudflare)
- **Main Gateway**: https://platformmakers.org
- **Gateway Management**: https://gateway.platformmakers.org
- **AI Learning Assistant**: https://learning.platformmakers.org
- **Golf Course Management**: https://golfcourse.platformmakers.org
- **Admin Panel**: https://admin.platformmakers.org

## 📋 Prerequisites

- Windows 10/11
- Node.js 18 LTS or higher
- PostgreSQL 15
- Cloudflare account (for external access)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/w-partners/omen-gateway.git
   cd omen-gateway
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Initialize the database**
   ```bash
   node src/db/init_v2.js
   ```

5. **Start the server**
   ```bash
   npm start
   ```

## 🔑 Default Accounts

The system comes with pre-configured accounts (password same as username):

- **Super Admin**: 01034424668
- **Admin**: 01012345678
- **Operator**: 01000000000
- **Member**: 01012341234

## 🏗️ Project Structure

```
OMEN SERVER GATEWAY/
├── src/
│   ├── server_v2.js        # Main server file
│   ├── db/                 # Database connection and schemas
│   ├── services/           # Business logic
│   └── views/              # EJS templates
├── config.yml              # Cloudflare tunnel configuration
├── servers.json            # Managed servers configuration
└── package.json            # Node.js dependencies
```

## 🚀 Quick Start

### Windows Auto-start Setup
Run the provided batch file to set up Windows auto-start:
```batch
CREATE-DESKTOP-SHORTCUTS.bat
```

### Manual Start/Stop
```batch
# Start the gateway
START-OMEN-GATEWAY.bat

# Stop the gateway
STOP-OMEN-GATEWAY.bat
```

## 🛠️ Configuration

### Cloudflare Tunnel
The project includes a pre-configured Cloudflare tunnel. To set up your own:

1. Install cloudflared
2. Run `cloudflared tunnel login`
3. Create a tunnel: `cloudflared tunnel create omen`
4. Update `config.yml` with your tunnel ID
5. Configure DNS in Cloudflare dashboard

### Server Management
Edit `servers.json` to add or modify managed servers:

```json
{
  "servers": [
    {
      "name": "Service Name",
      "port": 8080,
      "domain": "service.example.com",
      "description": "Service description"
    }
  ]
}
```

## 📊 Performance Goals

- Lighthouse Score: ≥ 90
- First Contentful Paint: < 1.8s
- Largest Contentful Paint: < 2.5s
- Total Blocking Time: < 200ms
- Cumulative Layout Shift: < 0.1

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e
```

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- **W-Partners Team** - [GitHub Organization](https://github.com/w-partners)

## 🆘 Support

For issues and questions, please use the [GitHub Issues](https://github.com/w-partners/omen-gateway/issues) page.

## 🔒 Security

This system includes:
- Role-based access control
- Secure password hashing
- Session management
- CSRF protection
- Input validation

## 📚 Documentation

Detailed documentation is available in the following files:
- `CLAUDE.md` - Development guidelines and standards
- `BUSINESS_DOMAIN.md` - Business logic documentation
- `CLOUDFLARE_TROUBLESHOOTING.md` - Cloudflare setup guide

---

**Built with ❤️ by W-Partners**