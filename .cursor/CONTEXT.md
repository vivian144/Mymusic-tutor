# MyMusic Tutor — Project Context

## App Overview
MyMusic Tutor is an Uber-style platform connecting music teachers 
with students for home tuition in India.
Tagline: "Master Music at Your Home"

## Business Model
- Platform takes 25%, teacher keeps 75%
- Package based booking (1, 2, 3, 6 months)
- 2-3 sessions per week, 1 hour each
- No refunds, reschedule only
- Launch city: Hyderabad → Telangana → India

## Users
- Students (kids + adults)
- Teachers (verified, grade certified)
- Admin (solo - project owner)

## Instruments
- Guitar, Drums, Keyboard (Phase 1)

## Syllabus
- Trinity Classical + Rock & Pop (Phase 1)
- Rockschool (Phase 2)

## Teacher System
- Teacher must be 2+ grades above student to teach
- Badge levels: Emerging, Verified, Senior, Elite
- Admin manually approves all teachers
- Aadhaar KYC + background check required

## Pricing Structure
Base prices per 3-month package (2 sessions/week):
- Basics & Initial: ₹14,000
- Grade 1-2: ₹17,000
- Grade 3-4: ₹21,000
- Grade 5-6: ₹25,000
- Grade 7-8: ₹29,000

Discounts: 6 months = 5% off, 12 months = 10% off
Teacher adjustment: ±10% from base only
Commission: Teacher 75%, Platform 25%
Travel fee: Built into price, not shown separately
Experience adjustments:
- Verified badge: +5%
- Senior badge: +10%
- Elite badge: +15%

## First Class Policy
- Called "First Class" NOT "demo class"
- Student pays same price as 1 regular session for their grade
- Completely separate from packages
- 1 per account lifetime - cannot be repeated
- 1 hour duration
- Grade and instrument specific
- Teacher earns 75%, platform earns 25% (same as regular)
- After first class → student buys package separately
- Same teacher preferred for package unless student requests change
- Acts as conversion funnel into package purchase

## Reminder System
- 24hr before → WhatsApp + app notification
- 2hr before → Second reminder
- 15min before → Teacher on the way ping
- Student absent → Auto warning, makeup session added
- Teacher absent → Free reschedule, 3 no-shows = suspended

## Tech Stack
- Frontend: React.js (web), React Native (mobile later)
- Backend: Node.js + Express
- Database: PostgreSQL + Redis
- Payments: Razorpay
- WhatsApp: Twilio/Interakt
- Maps: Google Maps API
- Hosting: AWS
- Containers: Docker

## Current Build Status
- [x] Project structure created
- [x] Backend server running (port 5000)
- [x] PostgreSQL + Redis running via Docker
- [x] Database models created (User, TeacherProfile, 
      StudentProfile, Package, Session)
- [ ] Authentication (JWT)
- [ ] Teacher registration API
- [ ] Student registration API
- [ ] Admin approval system
- [ ] Booking system
- [ ] Payment integration
- [ ] WhatsApp notifications
- [ ] Frontend (React)
- [ ] Admin dashboard
- [ ] Deployment

## Important Notes
- Windows machine (HP laptop)
- GitHub: github.com/vivian144/Mymusic-tutor
- Remind owner to buy domain (mymusictutor.in) on Day 18
- Remind owner to setup Razorpay on Day 14
- Demo class feature → add AFTER base app is complete
- Instrument rental (₹1000 extra) → Phase 2
- Sibling discount → Phase 2
- Rockschool syllabus → Phase 2
- Exam center finder → Phase 2

## Post Launch Features (Do NOT build before launch)
- WhatsApp AI chatbot (Claude API powered, English only)
- In-app chat support widget
- Support team dashboard
- Demo class feature
- Instrument rental (teacher brings for ₹1000 extra)
- Sibling discount system
- Rockschool syllabus
- Exam center finder expanded statewide
- React Native mobile app
- Telugu language support

## Security Implementation
- Rate limiting: 8 limiters (auth/booking/payment/admin/general)
- Account lockout: 5 fails=15min, 10 fails=24hr, 20 fails=admin flag
- Progressive delays on failed logins
- Helmet security headers fully configured
- CORS: production allows mymusictutor.in only
- Input sanitization: XSS, HPP, NoSQL injection protected
- Request size limit: 10kb max
- Password strength: min 8 chars, upper+lower+number+special
- Password never exposed in any API response
- Booking amount verified server side always
- Admin audit log: all actions logged to AdminLog table
- JWT secret: minimum 32 chars enforced, 64+ recommended
- Redis: password protected
- Razorpay webhook verification: TODO (build with payments)