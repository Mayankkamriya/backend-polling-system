# 🗳️ Real-Time Polling Application API

> **Move37 Ventures Backend Developer Challenge - Enterprise-Grade Implementation**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](https://www.prisma.io/)
[![Socket.IO](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)](https://socket.io/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

A **production-ready** real-time polling application API designed for the Move37 Ventures Backend Developer Challenge. This implementation showcases advanced backend development practices, real-time communication, and enterprise-grade architecture.

---

## 📋 **Challenge Requirements Compliance**

### ✅ **Core Requirements Met**

| Requirement | Implementation | Status |
|-------------|---------------|--------|
| **Node.js + Express.js** | TypeScript implementation with Express.js framework | ✅ Complete |
| **PostgreSQL Database** | Production-ready PostgreSQL with connection pooling | ✅ Complete |
| **Prisma ORM** | Advanced schema with relationships and migrations | ✅ Complete |
| **WebSocket Communication** | Socket.IO with real-time vote broadcasting | ✅ Complete |
| **RESTful API** | Complete CRUD operations for all entities | ✅ Complete |
| **Database Relationships** | Proper one-to-many and many-to-many relationships | ✅ Complete |
| **Project Setup** | Docker support, comprehensive documentation | ✅ Complete |

### 🏗️ **Architecture Overview**

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
│              (React, Vue, Angular, Mobile)                  │
└─────────────────┬───────────────────┬───────────────────────┘
                  │                   │
                  ▼                   ▼
         ┌─────────────────┐  ┌─────────────────┐
         │   REST API      │  │   WebSocket     │
         │   (HTTP/HTTPS)  │  │   (Socket.IO)   │
         └─────────────────┘  └─────────────────┘
                  │                   │
                  └───────────┬───────┘
                              ▼
              ┌─────────────────────────────────┐
              │         Express.js Server       │
              │      (Node.js + TypeScript)     │
              └─────────────────┬───────────────┘
                                │
                                ▼
              ┌─────────────────────────────────┐
              │         Prisma ORM              │
              │    (Database Abstraction)       │
              └─────────────────┬───────────────┘
                                │
                                ▼
              ┌─────────────────────────────────┐
              │      PostgreSQL Database        │
              │    (Persistent Data Storage)    │
              └─────────────────────────────────┘
```

---

## 🚀 **Quick Start Guide**

### **Prerequisites**

Ensure you have the following installed:

- **Node.js** (v18.0.0 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v13.0.0 or higher) - [Download](https://www.postgresql.org/download/)
- **npm** or **yarn** (Package manager)
- **Git** - [Download](https://git-scm.com/)

**Optional but Recommended:**
- **Docker** & **Docker Compose** - [Download](https://www.docker.com/)

### **⚡ Installation & Setup**

#### **Option 1: Local Development Setup**

```bash
# 1. Clone the repository
git clone https://github.com/Mayankkamriya/backend-polling-system.git
cd real-time-polling-api-complete-2

# 2. Install dependencies
npm install

# 3. Environment configuration
cp .env.example .env
# Edit .env with your database credentials

# 4. Database setup
createdb polling_db  # or use PostgreSQL GUI
npm run db:migrate
npm run db:seed

# 5. Start development server
npm run dev

# 6. Verify installation
curl http://localhost:3000/health
```

#### **Option 2: Docker Setup (Recommended)**

```bash
# 1. Clone the repository
git clone https://github.com/Mayankkamriya/backend-polling-system.git
cd real-time-polling-api-complete-2

# 2. Start with Docker Compose
docker-compose up -d

# 3. Setup database
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npx prisma db seed

# 4. Verify installation
curl http://localhost:3000/health
```

### **🔧 Environment Configuration**

Create a `.env` file with the following configuration:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/polling_db"

# JWT Configuration
JWT_SECRET="super-secret-jwt-key-for-dev"
JWT_REFRESH_SECRET="super-refresh-secret-key-for-dev"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server Configuration
NODE_ENV="development"
PORT=3000
HOST="0.0.0.0"

# CORS Configuration
CORS_ORIGIN="http://localhost:3000,http://localhost:3001"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 🗄️ **Database Schema & Relationships**

### **Entity Relationship Diagram**

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│      User       │     │      Poll       │     │   PollOption    │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id: String (PK) │────▶│ id: String (PK) │────▶│ id: String (PK) │
│ name: String    │ 1:N │ question: String│ 1:N │ text: String    │
│ email: String   │     │ isPublished: B  │     │ pollId: String  │
│ passwordHash: S │     │ createdAt: Date │     │ (FK → Poll.id)  │
│ createdAt: Date │     │ updatedAt: Date │     └─────────────────┘
│ updatedAt: Date │     │ creatorId: S(FK)│              │
└─────────────────┘     └─────────────────┘              │
         │                        │                      │
         │                        │                      │
         │                        │                      ▼
         │                        │           ┌─────────────────┐
         │                        │           │      Vote       │
         │                        │           ├─────────────────┤
         │                        │           │ id: String (PK) │
         │                        │           │ userId: String  │
         │                        │           │ (FK → User.id)  │
         │                        │           │ pollOptionId: S │
         │                        │           │ (FK → PollOpt)  │
         │                        │           │ createdAt: Date │
         │                        │           │ updatedAt: Date │
         │                        │           └─────────────────┘
         │                        │                      ▲
         └────────────────────────┼──────────────────────┘
                                  │
                              Many-to-Many
                           (User ↔ PollOption)
                             via Vote table
```

### **Prisma Schema Models**

#### **User Model**
```prisma
model User {
  id           String   @id @default(cuid())
  name         String
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  // Relationships
  polls        Poll[]   // One-to-Many: User creates many Polls
  votes        Vote[]   // One-to-Many: User casts many Votes
}
```

#### **Poll Model**
```prisma
model Poll {
  id          String      @id @default(cuid())
  question    String
  isPublished Boolean     @default(false)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  creatorId   String
  
  // Relationships
  creator     User        @relation(fields: [creatorId], references: [id])
  options     PollOption[] // One-to-Many: Poll has many Options
}
```

#### **PollOption Model**
```prisma
model PollOption {
  id     String @id @default(cuid())
  text   String
  pollId String
  
  // Relationships
  poll   Poll   @relation(fields: [pollId], references: [id])
  votes  Vote[] // One-to-Many: Option receives many Votes
}
```

#### **Vote Model (Join Table)**
```prisma
model Vote {
  id           String     @id @default(cuid())
  userId       String
  pollOptionId String
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  
  // Relationships
  user         User       @relation(fields: [userId], references: [id])
  pollOption   PollOption @relation(fields: [pollOptionId], references: [id])
  
  // Constraints
  @@unique([userId, pollOptionId]) // Prevent duplicate votes
}
```

---

## 🌐 **API Documentation**

### **Base URL**
```
Development: http://localhost:3000
Production:  https://your-domain.com
```

### **Authentication**

The API uses **JWT (JSON Web Tokens)** for authentication:

```bash
# Include in request headers
Authorization: Bearer <your-jwt-token>
```

### **📝 Authentication Endpoints**

#### **1. User Registration**
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Amit Kumar",
  "email": "amit@gmail.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "cuid_user_id",
    "name": "Amit Kumar",
    "email": "amit@gmail.com",
    "createdAt": "2025-09-12T10:00:00.000Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### **2. User Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "amit@gmail.com",
  "password": "SecurePassword123!"
}
```

#### **3. Token Refresh**
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### **👥 User Endpoints**

#### **Get User Profile**
```http
GET /api/users/profile
Authorization: Bearer <token>
```

### **📊 Poll Endpoints**

#### **1. Create Poll**
```http
POST /api/polls
Authorization: Bearer <token>
Content-Type: application/json

{
  "question": "What is your favorite programming language?",
  "options": [
    {"text": "JavaScript"},
    {"text": "Python"},
    {"text": "TypeScript"},
    {"text": "Go"}
  ]
}
```

**Response:**
```json
{
  "message": "Poll created successfully",
  "poll": {
    "id": "cuid_poll_id",
    "question": "What is your favorite programming language?",
    "isPublished": false,
    "createdAt": "2025-09-12T10:00:00.000Z",
    "options": [
      {
        "id": "cuid_option_1",
        "text": "JavaScript",
        "pollId": "cuid_poll_id"
      }
    ],
    "creator": {
      "id": "cuid_user_id",
      "name": "Amit Kumar"
    }
  }
}
```

#### **2. Get All Polls**
```http
GET /api/polls?page=1&limit=10&published=true
```

#### **3. Get Single Poll**
```http
GET /api/polls/:pollId
```

#### **4. Update Poll**
```http
PUT /api/polls/:pollId
Authorization: Bearer <token>
Content-Type: application/json

{
  "question": "Updated poll question",
  "options": [
    {"text": "Option 1"},
    {"text": "Option 2"}
  ]
}
```

#### **5. Delete Poll**
```http
DELETE /api/polls/:pollId
Authorization: Bearer <token>
```

#### **6. Publish Poll**
```http
PUT /api/polls/:pollId/publish
Authorization: Bearer <token>
```

### **🗳️ Vote Endpoints**

#### **1. Submit Vote**
```http
POST /api/polls/:pollId/vote
Authorization: Bearer <token>
Content-Type: application/json

{
  "pollOptionId": "cuid_option_id"
}
```

**Response:**
```json
{
  "message": "Vote submitted successfully",
  "vote": {
    "id": "cuid_vote_id",
    "pollOptionId": "cuid_option_id",
    "optionText": "JavaScript",
    "pollQuestion": "What is your favorite programming language?",
    "createdAt": "2025-09-12T10:00:00.000Z"
  }
}
```

#### **2. Get User's Vote for Poll**
```http
GET /api/polls/:pollId/my-vote
Authorization: Bearer <token>
```

#### **3. Get Poll Results**
```http
GET /api/polls/:pollId/results
```

**Response:**
```json
{
  "poll": {
    "id": "cuid_poll_id",
    "question": "What is your favorite programming language?",
    "totalVotes": 150,
    "options": [
      {
        "id": "cuid_option_1",
        "text": "JavaScript",
        "voteCount": 75,
        "percentage": 50.0
      },
      {
        "id": "cuid_option_2",
        "text": "Python",
        "voteCount": 45,
        "percentage": 30.0
      }
    ]
  }
}
```

#### **4. Get User's Voting History**
```http
GET /api/votes/my-votes?page=1&limit=10
Authorization: Bearer <token>
```

---

## 🔌 **WebSocket Real-Time Communication**

### **Connection Setup**

```javascript
// Client-side connection
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### **WebSocket Events**

#### **1. Join Poll Room**
```javascript
// Join a specific poll room for real-time updates
socket.emit('join-poll', pollId);
```

#### **2. Leave Poll Room**
```javascript
// Leave poll room
socket.emit('leave-poll', pollId);
```

#### **3. Real-Time Vote Updates**
```javascript
// Listen for vote updates
socket.on('vote-update', (data) => {
  console.log('Vote update received:', data);
  // Update UI with new vote counts
  updatePollResults(data.poll);
});
```

#### **4. New Poll Notifications**
```javascript
// Listen for new published polls
socket.on('new-poll', (data) => {
  console.log('New poll published:', data.poll);
  // Add new poll to UI
  addPollToList(data.poll);
});
```

### **Real-Time Event Data Structure**

#### **Vote Update Event**
```json
{
  "event": "vote-update",
  "poll": {
    "id": "cuid_poll_id",
    "question": "What is your favorite programming language?",
    "options": [
      {
        "id": "cuid_option_1",
        "text": "JavaScript",
        "voteCount": 76
      }
    ],
    "totalVotes": 151
  },
  "newVote": {
    "optionId": "cuid_option_1",
    "optionText": "JavaScript"
  }
}
```

---

## 🧪 **Testing the API**

### **Automated Test Suite**

Run the comprehensive test suite:

```bash
# Run all tests
npm test

# Run specific test categories
npm run test:auth
npm run test:polls
npm run test:votes
npm run test:websockets

# Run tests with coverage
npm run test:coverage
```

### **Manual Testing with cURL**

#### **1. Health Check**
```bash
curl -X GET http://localhost:3000/health
```

#### **2. User Registration**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "SecurePassword123!"
  }'
```

#### **3. Create Poll**
```bash
# First, get the token from registration/login
TOKEN="your-jwt-token-here"

curl -X POST http://localhost:3000/api/polls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "question": "Best backend framework?",
    "options": [
      {"text": "Express.js"},
      {"text": "FastAPI"},
      {"text": "NestJS"}
    ]
  }'
```

#### **4. Submit Vote**
```bash
# Use poll ID and option ID from previous responses
curl -X POST http://localhost:3000/api/polls/POLL_ID/vote \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "pollOptionId": "OPTION_ID"
  }'
```

### **Testing with Postman**

1. **Import Collection**: Use the provided Postman collection file
2. **Set Environment Variables**:
   - `baseUrl`: `http://localhost:3000`
   - `token`: Your JWT token
3. **Run Collection Tests**: Execute automated test scenarios

### **WebSocket Testing**

#### **Using wscat (CLI)**
```bash
# Install wscat
npm install -g wscat

# Connect to WebSocket
wscat -c ws://localhost:3000/socket.io/\?EIO\=4\&transport\=websocket

# Send join poll event
{"type":"join-poll","pollId":"your-poll-id"}
```

#### **Browser Testing**
```html
<!DOCTYPE html>
<html>
<head>
    <title>WebSocket Test</title>
    <script src="/socket.io/socket.io.js"></script>
</head>
<body>
    <script>
        const socket = io();
        
        // Join poll room
        socket.emit('join-poll', 'your-poll-id');
        
        // Listen for updates
        socket.on('vote-update', (data) => {
            console.log('Real-time update:', data);
        });
    </script>
</body>
</html>
```

---

## 📝 **Available Scripts**

### **Development**
```bash
npm run dev          # Start development server with hot reload
npm run dev:debug    # Start with Node.js debugger
npm run build        # Build TypeScript to JavaScript
npm run start        # Start production server
```

### **Database**
```bash
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Prisma Studio
npm run db:reset     # Reset database (destructive)
npm run db:generate  # Generate Prisma client
```

### **Testing & Quality**
```bash
npm test             # Run test suite
npm run test:watch   # Run tests in watch mode
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run typecheck    # Run TypeScript compiler check
```

---

## 🔐 **Security Features**

### **Authentication & Authorization**
- ✅ **JWT Tokens**: Secure stateless authentication
- ✅ **Password Hashing**: bcrypt with salt rounds
- ✅ **Token Refresh**: Automatic token renewal
- ✅ **Role-Based Access**: Poll ownership verification

### **Input Validation**
- ✅ **Schema Validation**: Zod schema validation
- ✅ **SQL Injection Prevention**: Prisma ORM protection
- ✅ **XSS Protection**: Input sanitization
- ✅ **Rate Limiting**: Request rate controls

### **Security Headers**
- ✅ **CORS**: Cross-origin resource sharing
- ✅ **Helmet**: Security headers middleware
- ✅ **Content Security Policy**: XSS protection
- ✅ **HTTPS Ready**: TLS/SSL support

---

## 📊 **Performance & Monitoring**

### **Database Optimization**
- ✅ **Connection Pooling**: Efficient database connections
- ✅ **Query Optimization**: Indexed columns
- ✅ **Pagination**: Large dataset handling
- ✅ **Caching**: Redis integration ready

### **Application Monitoring**
- ✅ **Health Checks**: System status endpoints
- ✅ **Logging**: Structured application logs
- ✅ **Error Tracking**: Comprehensive error handling
- ✅ **Metrics**: Performance monitoring ready

### **Scalability Features**
- ✅ **Stateless Design**: Horizontal scaling ready
- ✅ **WebSocket Clustering**: Redis adapter support
- ✅ **Load Balancer Ready**: Session-independent
- ✅ **Microservice Ready**: Modular architecture

---

### **Testing Strategy**
- ✅ **Unit Tests**: Individual function testing
- ✅ **Integration Tests**: API endpoint testing
- ✅ **E2E Tests**: Full workflow testing
- ✅ **Load Tests**: Performance validation

---

## 📄 **License**

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👏 **Acknowledgments**

- **Move37 Ventures** - For the challenging and comprehensive backend developer assessment

---

**Built with ❤️ for the Move37 Ventures Backend Developer Challenge**

> This implementation demonstrates production-ready backend development practices, real-time communication systems, and enterprise-grade architecture suitable for modern web applications.

---

*Last updated: September 15, 2025*