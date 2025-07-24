# PediaSignal - Pediatric Emergency Training Platform

## Overview

PediaSignal is a comprehensive full-stack platform focused on solving pediatric emergency and education problems using AI. The system includes medical training simulations, X-ray analysis for abuse detection, misinformation monitoring, and a parent triage chatbot. The platform uses role-based authentication to provide different access levels for medical students, pediatricians, and administrators.

## User Preferences

Preferred communication style: Simple, everyday language.
UI Design: Professional look with thin fonts (Inter font family), HIPAA/SOC 2/ISO 27001 compliance standards.
Security Requirements: End-to-end encryption, enterprise-grade security middleware.
Statistical Accuracy: All numbers must be completely truthful and reflect actual development status - no inflated metrics or false claims.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript and Vite for development
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom medical theme variables
- **State Management**: TanStack React Query for server state management
- **Routing**: Wouter for client-side routing (single page with anchor navigation)
- **Build System**: Vite with ESM modules

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon serverless)
- **AI Integration**: OpenAI GPT-4 for clinical explanations and analysis
- **File Upload**: Multer for handling X-ray image uploads

### Database Design
The system uses a PostgreSQL database with the following key tables:
- **users**: Role-based user management (medical_student, pediatrician, admin)
- **simulations**: Medical training simulation sessions with vitals and interventions
- **xrayAnalyses**: X-ray abuse detection results with confidence scores
- **misinfoLogs**: Misinformation monitoring logs with risk classifications
- **chatConversations**: Parent triage chatbot conversation history
- **waitlist**: Platform access waitlist with approval workflow

## Key Components

### Medical Simulation Module
- Interactive pediatric emergency case scenarios (febrile seizure, respiratory distress)
- Real-time vital sign monitoring with AI-generated clinical explanations
- Intervention tracking and outcome prediction
- Progressive case complexity based on user actions

### X-ray Analysis System
- Base64 image upload and processing
- AI-powered abuse pattern detection with confidence scoring
- Fracture type classification and risk assessment
- Historical analysis tracking for forensic purposes

### Misinformation Monitor
- Chrome extension with pediatric content detection
- Only activates when pediatric health keywords are detected
- AI-powered misinformation pattern analysis
- Risk scoring system with visual warnings for dangerous claims

### Triage Chatbot
- Parent-facing symptom assessment interface
- OpenAI integration with safety-first medical prompts
- Emergency escalation protocols
- Session-based conversation tracking

### Access Control
- **Waitlist System**: All features are currently waitlisted, requiring approval for access
- **Admin Panel**: Administrators can manage waitlist entries and approve users
- **Single Page Design**: One long page with 6 sections: Features, How it works, AI Tools, Why, FAQ, Contact

## Data Flow

1. **Waitlist Flow**: User submits application → Admin reviews → Approval/rejection → Access granted
2. **Landing Page Navigation**: Single page with anchor-based navigation between 6 main sections
3. **Admin Management**: Admin login → Waitlist dashboard → Status updates → User management
4. **Chrome Extension**: Page analysis → Pediatric content detection → Misinformation assessment → Risk warnings
5. **Professional Design**: Consistent thin typography, no colorful elements, enterprise-grade appearance

## External Dependencies

### AI and Machine Learning
- **OpenAI GPT-4**: Clinical explanations, misinformation detection, triage responses
- **PyTorch/CNN Model**: X-ray abuse pattern detection (served via FastAPI)
- **Transformer Models**: RoBERTa-base for misinformation classification

### Database and Storage
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle ORM**: Type-safe database operations
- **Base64 Encoding**: Image storage and processing

### UI and Styling
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling framework
- **Lucide Icons**: Icon library for medical interface elements

### Development Tools
- **TypeScript**: Type safety across frontend and backend
- **Vite**: Fast development build tool
- **ESBuild**: Production bundling
- **Replit Integration**: Development environment support

## Deployment Strategy

### Production Deployment (Vercel)
- **Platform**: Vercel serverless functions
- **Build Process**: Vite production build with optimized bundles
- **Static Assets**: Served from dist/public directory
- **Backend**: Node.js serverless functions with 30s timeout
- **Configuration**: vercel.json with API routing and build settings

### Database
- **Production**: Neon serverless PostgreSQL (recommended)
- **Connection**: Environment variable DATABASE_URL
- **Migration**: Drizzle Kit push command for schema updates

### Environment Configuration
- **Development**: .env.local with development variables
- **Production**: Vercel environment variables dashboard
- **Required Variables**: DATABASE_URL, OPENAI_API_KEY, SESSION_SECRET
- **Optional**: REPL_ID, ISSUER_URL, REPLIT_DOMAINS for authentication

### Database Migrations
- **Drizzle Kit**: Schema migrations in ./migrations directory
- **Push Command**: `npm run db:push` for schema updates
- **Schema Location**: Shared schema definitions in ./shared/schema.ts

The system is designed for scalability with serverless architecture, type-safe development practices, and modular component design to support the complex requirements of medical training and AI-powered analysis.