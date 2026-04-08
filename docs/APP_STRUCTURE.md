# Vahan - Vehicle Inventory Portal

## Page Structure & Navigation

### Authentication Pages (Unauthenticated)
| Page | URL | Purpose | Components |
|------|-----|---------|-------------|
| Login | `/{locale}/login` | User authentication | LoginForm |
| Signup | `/{locale}/signup` | New user registration | SignupForm |
| Pending Approval | `/{locale}/pending-approval` | Shown after signup | Static message |
| Access Denied | `/{locale}/access-denied` | Blocked access | Static message |

### Authenticated Pages (App Shell)
| Page | URL | Purpose | Components |
|------|-----|---------|-------------|
| Dashboard | `/{locale}/app` | Overview & quick stats | Stat cards, Quick actions |
| Inventory | `/{locale}/app/inventory` | Browse vehicle listings | VehicleGrid, VehicleCard |
| Reserved | `/{locale}/app/reserved` | Reserved vehicles | Not implemented |
| Sold | `/{locale}/app/sold` | Sold vehicles | Not implemented |
| Inquiries | `/{locale}/app/inquiries` | My inquiries | Not implemented |
| Chat | `/{locale}/app/chat` | Messaging | ChatWindow, ChatThreadList |
| My Requests | `/{locale}/app/my-requests` | My reservations/waitlist | Not implemented |
| Profile | `/{locale}/app/profile` | User settings | Account info, Preferences |

### Admin Pages (Not implemented)
- `/app/admin/users` - User management
- `/app/admin/vehicles` - Vehicle management
- `/app/admin/seller-submissions` - Seller submissions
- `/app/admin/reservation-requests` - Reservation management
- `/app/admin/waitlist` - Waitlist management
- `/app/admin/resale-requests` - Resale requests
- `/app/admin/chat` - Admin chat
- `/app/admin/settings` - Settings

---

## Button & Action Mapping

### Navigation Sidebar
| Button/Link | Action | Target |
|-------------|--------|--------|
| Dashboard | Navigate to | `/{locale}/app` |
| Inventory | Navigate to | `/{locale}/app/inventory` |
| Reserved | Navigate to | `/{locale}/app/reserved` |
| Sold | Navigate to | `/{locale}/app/sold` |
| Inquiries | Navigate to | `/{locale}/app/inquiries` |
| Chat | Navigate to | `/{locale}/app/chat` |
| My Requests | Navigate to | `/{locale}/app/my-requests` |
| Profile | Navigate to | `/{locale}/app/profile` |
| Logout | POST /api/auth/logout | Redirect to login |

### Login Page
| Button | Action |
|--------|--------|
| Login (submit) | POST /api/auth/login → Redirect /en/app |
| Forgot Password | Navigate to /en/forgot-password (not implemented) |
| Signup Link | Navigate to /en/signup |

### Signup Page
| Button | Action |
|--------|--------|
| Create Account | POST /api/auth/signup → Redirect /en/pending-approval |
| Login Link | Navigate to /en/login |

### Dashboard Page
| Button | Action |
|--------|--------|
| Browse Inventory | Navigate to /{locale}/app/inventory |
| Start Chat | Navigate to /{locale}/app/chat |
| My Profile | Navigate to /{locale}/app/profile |

### Vehicle Card Component
| Button | Action |
|--------|--------|
| Heart (Save) | Toggle save (not implemented) |
| Share | Open share dialog (not implemented) |
| View Details | Navigate to vehicle detail |
| Reserve | Open reservation dialog |
| Inquiry | Open inquiry dialog |

### Vehicle Detail Page
| Button | Action |
|--------|--------|
| Back | Navigate back |
| Reserve Interest | Open reservation dialog |
| Send Inquiry | Open inquiry dialog |
| Save (Heart) | Toggle save (not implemented) |
| Share | Open share dialog (not implemented) |

### Reservation Form Dialog
| Button | Action |
|--------|--------|
| Reserve Interest (trigger) | Open dialog |
| Submit Request | POST reservation (not implemented) |
| Cancel | Close dialog |

### Inquiry Form Dialog
| Button | Action |
|--------|--------|
| Send Inquiry (trigger) | Open dialog |
| Send | POST inquiry (not implemented) |
| Cancel | Close dialog |

### Chat Window
| Button | Action |
|--------|--------|
| Phone | Start voice call (not implemented) |
| Video | Start video call (not implemented) |
| More | Open options menu (not implemented) |
| Attachment | Open file picker |
| Image | Open image picker |
| Mic | Start voice recording |
| Send | Send message |

### Profile Page
| Button | Action |
|--------|--------|
| Sign Out | POST /api/auth/logout → Redirect /{locale}/login |

---

## Component Library

### UI Components (shadcn/ui)
| Component | Location | Usage |
|-----------|----------|-------|
| Button | components/ui/button.tsx | Actions, links |
| Card | components/ui/card.tsx | Content containers |
| Dialog | components/ui/dialog.tsx | Modal forms |
| Form | components/ui/form.tsx | Form fields |
| Input | components/ui/input.tsx | Text fields |
| Label | components/ui/label.tsx | Field labels |
| Textarea | components/ui/textarea.tsx | Multi-line text |
| Select | components/ui/select.tsx | Dropdowns |
| Badge | components/ui/badge.tsx | Status badges |
| Avatar | components/ui/avatar.tsx | User avatars |
| Table | components/ui/table.tsx | Data tables |
| Tabs | components/ui/tabs.tsx | Tab navigation |
| DropdownMenu | components/ui/dropdown-menu.tsx | Menus |
| Popover | components/ui/popover.tsx | Popups |
| Tooltip | components/ui/tooltip.tsx | Hover hints |
| Sheet | components/ui/sheet.tsx | Side sheets |
| Toast | components/ui/toast.tsx | Notifications |
| Skeleton | components/ui/skeleton.tsx | Loading states |
| Separator | components/ui/separator.tsx | Dividers |
| ScrollArea | components/ui/scroll-area.tsx | Scrollable areas |
| Alert | components/ui/alert.tsx | Alerts |

### Feature Components
| Component | Location | Purpose |
|-----------|----------|---------|
| VehicleCard | components/vehicle/ | Vehicle listing card |
| VehicleGrid | components/vehicle/ | Filterable vehicle list |
| VehicleDetail | components/vehicle/ | Full vehicle details |
| ReservationForm | components/reservation/ | Reserve vehicle dialog |
| WaitlistButton | components/reservation/ | Join waitlist |
| InquiryForm | components/inquiry/ | Send inquiry dialog |
| ChatWindow | components/chat/ | Chat interface |
| ChatProvider | components/chat/ | Chat state management |
| SellerSubmissionForm | components/seller/ | Sell vehicle form |
| ResaleRequestForm | components/seller/ | Request resale |
| OnlineStatusIndicator | components/ | Offline indicator |

---

## Database Schema (Supabase)

### Tables
- `user_profiles` - User role, approval status, financials access
- `vehicles` - Physical vehicle attributes (make, model, year, etc.)
- `vehicle_listings` - Sellable inventory with pricing and status
- `vehicle_media` - Images and media for listings
- `seller_submissions` - External seller vehicle submissions
- `inquiries` - User inquiries about vehicles
- `reservation_requests` - Vehicle reservation requests
- `reservation_waitlist` - Waitlist for reserved vehicles
- `resale_requests` - User resale requests
- `chat_threads` - Chat conversations
- `chat_participants` - Thread participants
- `chat_messages` - Messages (text, voice, image)
- `activity_logs` - User actions log

---

## Current Issues & Gaps

### Not Implemented
1. **Reserved, Sold, Inquiries, My Requests pages** - Empty/stub pages
2. **All Admin pages** - Not created
3. **Forgot Password** - Link exists but page doesn't
4. **Vehicle Detail Page** - No actual page, just component
5. **Save/Favorite vehicles** - Button exists but not functional
6. **Share functionality** - Button exists but not functional
7. **Offline sync** - IndexedDB setup exists but not connected to UI
8. **User approval workflow** - Admin approval not implemented

### Bugs/Issues
1. Hardcoded `/en/` locale in some links instead of using dynamic locale
2. Dashboard stats are hardcoded (0 values)
3. Vehicle detail page not accessible (no route)
4. Chat provider not integrated into the app shell
5. No error boundaries
6. No loading states for many pages

---

## API Routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/login` | POST | Authenticate user |
| `/api/auth/signup` | POST | Register new user |
| `/api/auth/logout` | POST | Sign out user |

---

## Feature Flags & Permissions

### User Roles
- `admin` - Full access, can manage users, vehicles, approvals
- `manager` - Can view all listings, manage some operations
- `user` - Standard user, view approved content only

### Approval Status
- `pending_approval` - New user awaiting admin approval
- `approved` - Full access
- `rejected` - Blocked access

### Financial Visibility
- Admins/Managers see all financial data
- Regular users see target price only (if approved)
- Procurement cost hidden from regular users

---

## PWA Features (Configured)
- Service worker for offline support
- Offline indicator component
- IndexedDB for vehicle data caching
- Pending actions queue for offline operations
- Manifest for installable app

---

## i18n Support
- English (en.json)
- Hindi (hi.json)
- Dynamic locale routing via [locale] route group
- next-intl v4 integration