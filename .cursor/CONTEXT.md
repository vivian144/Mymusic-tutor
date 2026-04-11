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

## Package & Pricing
| Package | Reschedules |
|---------|------------|
| 1 Month | 1 |
| 2 Months | 2 |
| 3 Months | 3 |
| 6 Months | 5 |

## Grade Pricing (Per Session)
| Grade | Price Range |
|-------|------------|
| Beginner | ₹300-500 |
| Grade 1-2 | ₹400-600 |
| Grade 3-4 | ₹600-900 |
| Grade 5-6 | ₹900-1200 |
| Grade 7-8 | ₹1200-1800 |

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