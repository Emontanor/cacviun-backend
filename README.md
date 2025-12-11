# CACVIUN Backend

Backend for the CACVIUN project (Violence Attention and Channeling Center at Universidad Nacional) - Violence reporting system for Universidad Nacional de Colombia campus.

**Base Repository:** [VIPIngeSoftII](https://github.com/juserranor/VIPIngeSoftII.git)

## Description

REST API developed with NestJS to manage violence reports on university campus, including incident geolocation, classification by violence type, and analytical dashboard.

## Technologies

### Framework & Language
- **NestJS 11** - Progressive Node.js framework for building efficient server-side applications
- **TypeScript 5.7** - Main language with experimental decorators support
- **Node.js** - Runtime environment (recommended v18+)

### Database
- **MongoDB 6.21** - NoSQL database for report storage
- **BSON 6.0** - Binary data serialization

### Email Services
- **SendGrid** - Transactional email service
- **MailerSend 2.6** - Alternative for email management
- **Resend 6.5** - Modern email service
- **Nodemailer 7.0** - SMTP client for Node.js

### Geolocation
- **Turf.js 7.3** - Advanced geospatial analysis
  - `@turf/boolean-point-in-polygon` - Point detection within campus zones
  - `@turf/helpers` - Geospatial utilities

### Security
- **bcrypt 6.0** - Secure password hashing

### Testing
- **Jest 30** - Unit and integration testing framework
- **Supertest 7** - HTTP endpoint testing
- **ts-jest 29** - TypeScript transformer for Jest

### Development Tools
- **ESLint 9.18** - Code quality linter
- **Prettier 3.4** - Automatic code formatter
- **ts-node 10.9** - Direct TypeScript execution in development

### Other Dependencies
- **Express** - HTTP server (integrated in NestJS)
- **RxJS 7.8** - Reactive programming
- **Reflect Metadata** - Decorator support

## Project Structure

```
src/
├── app.module.ts              # Application root module
├── app.controller.ts          # Main controller
├── app.service.ts             # Main service
├── main.ts                    # Application entry point
│
├── database/                  # Database module
│   ├── mongo.module.ts        # MongoDB configuration
│   ├── mongo.service.ts       # MongoDB connection service
│   └── mongo.controller.ts    # Database controller
│
└── modules/                   # Functional modules
    ├── Dtos/                  # Global Data Transfer Objects
    │   └── session.dto.ts     # Session DTO
    │
    ├── user/                  # User module
    │   ├── user.module.ts     # Module configuration
    │   ├── user.controller.ts # User endpoints
    │   ├── user.service.ts    # User business logic
    │   └── Dtos/
    │       ├── login.dto.ts           # Login DTO
    │       ├── user.dto.ts            # User DTO
    │       ├── verification-code.dto.ts  # Verification code DTO
    │       └── verification.dto.ts    # Verification DTO
    │
    ├── report/                # Reports module
    │   ├── report.module.ts   # Module configuration
    │   ├── report.controller.ts # Report endpoints
    │   ├── report.service.ts  # Report business logic
    │   ├── Dtos/
    │   │   └── report.dot.ts  # Report DTO
    │   └── assets/
    │       └── map.json       # GeoJSON map with campus zones
    │
    └── dashboard/             # Dashboard module
        ├── dashboard.module.ts    # Module configuration
        ├── dashboard.controller.ts # Statistics endpoints
        └── dashboard.service.ts   # Analytics and statistics logic
```

## Main Features

### 1. User Management
- Registration and authentication
- Code verification
- Session management

### 2. Violence Reports
- Geolocated report creation
- Classification by violence type:
  - Physical Violence
  - Psychological Violence
  - Sexual Violence
  - Workplace Violence
  - Discrimination
- Automatic campus zone detection via coordinates
- User report history
- Report updating and deletion

### 3. Analytical Dashboard
- Retrieval of all report locations
- Visualization of last 20 reports with:
  - Incident date
  - Violence type
  - Geographic coordinates

### 4. Geolocation
- Mapping of 39 Universidad Nacional campus zones
- Point-in-polygon detection algorithm using Turf.js
- Automatic conversion of GPS coordinates to identified zones

## Installation and Setup

### Prerequisites
- Node.js 18+ 
- MongoDB 6+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/juserranor/VIPIngeSoftII.git
cd cacviun-backend

# Install dependencies
npm install
```

### Environment Variables
Create a `.env` file in the project root with:

```env
MONGO_URI=mongodb://localhost:27017/cacviun
SENDGRID_API_KEY=your_api_key
# Other variables according to configured email services
```

## Running the Application

```bash
# Development (with hot-reload)
npm run start:dev

# Production
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

## Testing

```bash
# Unit tests
npm run test

# e2e tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## Main Endpoints

### Users
- `POST /user/register` - User registration
- `POST /user/login` - Login
- `POST /user/verify` - Account verification

### Reports
- `POST /report` - Create new report
- `GET /report/history/:email` - User report history
- `GET /report/admin-history` - All reports (admin)
- `PUT /report/:id` - Update report
- `DELETE /report/:id` - Delete report

### Dashboard
- `GET /dashboard/get-locations` - Coordinates of all reports
- `GET /dashboard/recent-violence` - Last 20 reports with details

## Available Scripts

```bash
npm run build          # Compile TypeScript to JavaScript
npm run format         # Format code with Prettier
npm run lint           # Run ESLint and fix errors
npm run start          # Start in production mode
npm run start:dev      # Start with hot-reload
npm run start:debug    # Start in debug mode
```

## Resources and References

- [NestJS Documentation](https://docs.nestjs.com)
- [MongoDB Documentation](https://www.mongodb.com/docs/)
- [Turf.js Documentation](https://turfjs.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## License

This project is under UNLICENSED license (private).

## 🙏 Acknowledgments


- Original codebase: [VIPIngeSoftII](https://github.com/juserranor/VIPIngeSoftII.git)
- Universidad Nacional de Colombia
- OpenStreetMap for map tiles
- All contributors and maintainers