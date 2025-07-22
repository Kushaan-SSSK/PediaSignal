# PediaSignal AI - Pediatric Emergency Training Platform

## Overview

PediaSignal AI is a comprehensive full-stack platform focused on solving pediatric emergency and education problems using AI. The system includes medical training simulations, X-ray analysis for abuse detection, misinformation monitoring, and a parent triage chatbot. The platform uses role-based authentication to provide different access levels for medical students, pediatricians, and administrators.

## User Preferences

Preferred communication style: Simple, everyday language.
UI Design: Professional look with thin fonts (Inter font family), HIPAA/SOC 2/ISO 27001 compliance standards.
Security Requirements: End-to-end encryption, enterprise-grade security middleware.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript and Vite for development
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom medical theme variables
- **State Management**: TanStack React Query for server state management
- **Routing**: Wouter for client-side routing
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
- Real-time content scraping and classification
- Transformer-based misinformation detection
- Risk scoring system (0-1 scale) with category tagging
- Dashboard for monitoring pediatric health misinformation trends

### Triage Chatbot
- Parent-facing symptom assessment interface
- OpenAI integration with safety-first medical prompts
- Emergency escalation protocols
- Session-based conversation tracking

### Role-Based Access Control
- **Medical Students**: Access to simulation module only
- **Pediatricians**: Full access to all modules including analysis tools
- **Administrators**: Complete system access with user management

## Data Flow

1. **Authentication Flow**: Users authenticate and receive role-based access permissions
2. **Simulation Flow**: User selects case → AI generates scenario → User applies interventions → AI provides clinical feedback → Results stored
3. **X-ray Analysis Flow**: Image upload → Base64 encoding → AI analysis → Risk assessment → Results storage
4. **Misinformation Monitoring**: Content scraping → AI classification → Risk scoring → Dashboard display
5. **Chatbot Flow**: Parent input → OpenAI processing → Safety assessment → Response generation → Emergency routing if needed

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

### Frontend Deployment
- **Platform**: Vercel (configured in vite.config.ts)
- **Build Process**: Vite production build with optimized bundles
- **Static Assets**: Served from dist/public directory

### Backend Deployment
- **Platform**: Railway or Render with GPU support for AI models
- **Environment**: Node.js with ES modules
- **Database**: Neon serverless PostgreSQL
- **Environment Variables**: OpenAI API keys, database URLs, Clerk authentication

### Environment Configuration
- **.env.local**: Local development variables
- **Production**: Clerk authentication, OpenAI API, Supabase/Neon database
- **Security**: API key management and role-based access enforcement

### Database Migrations
- **Drizzle Kit**: Schema migrations in ./migrations directory
- **Push Command**: `npm run db:push` for schema updates
- **Schema Location**: Shared schema definitions in ./shared/schema.ts

The system is designed for scalability with serverless architecture, type-safe development practices, and modular component design to support the complex requirements of medical training and AI-powered analysis.