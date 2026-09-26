# Arch Staff Hub

Build a Staff Order Management Dashboard called Arch Dashboard for managing inventory, creating orders, tracking delivery status, and team coordination. The app uses a red/white color scheme matching the attached Arch logo (1.png), supports Arabic and English with full RTL layout support, is mobile-optimized, and uses simple PIN + Name authentication.

📋 Core Features

1. Simple PIN & Name Login:
- Enter Staff Name (dropdown or selection from staff list)
- Enter 4-6 digit PIN (password field with masked dots)
- Verify credentials against staff records
- Remember session locally on this device
- Roles & Permissions: Admin (full access: create/edit/delete staff, stock, orders), Staff (create orders, view orders, mark as resolved), Viewer (view-only access)

2. Staff Management Section:
- View all staff members with names, PINs, and role indicators
- Add new staff (Name, PIN, Role: Admin/Staff/Viewer)
- Edit staff (Update name, PIN, Role)
- Delete staff

3. Stock/Inventory Management:
- Stock catalog display: stock image, stock name, available colors, stock quantity, unit price
- Add new stock with image upload functionality
- Edit stock details (name, colors, quantity, price)
- Delete stock items
- Search and filter by stock name or color

4. Order Creation & Management:
- Create Order Form:
  - Phone Number (required)
  - City (dropdown with pre-populated cities)
  - Items (select from stock catalog, choose color, amount/quantity)
  - Unit Price (auto-populated, editable)
  - Total Price (auto-calculated: Quantity × Unit Price)
  - Optional Notes (textarea)
  - Order Date (auto-generated timestamp)
- Order Actions:
  - Create: order appears in dashboard with Pending status for all staff
  - Edit: any staff can edit before resolved; view order details modal
  - Checkmark/Completion: click Resolve to mark with green checkmark and move to Completed
  - Order History: view past orders with status/date filters and search

5. UI / Design Requirements:
- Color Scheme: Primary Red (#E63946 / #FF0000), Light Red accents (#FFE5E5 / #F8D7DA), White background/cards (#FFFFFF), Dark Gray text (#333333)
- Arch diamond logo (from attached 1.png) prominently displayed on login screen and top/side navigation
- Top navigation bar / header with Arch logo, current logged-in user name & role, Language toggle (AR/EN), and Logout button
- Dashboard metric cards: Total Orders (Today/Week/Month), Pending Orders, Completed Orders, Active Staff Members
- Mobile-first layout: bottom navigation bar on mobile, collapsible sidebar on desktop, touch-friendly buttons (minimum 48px), single-column forms on mobile

6. Localization (Arabic & English):
- Language toggle button in header (AR / EN)
- Full RTL (Right-to-Left) layout when Arabic is selected
- Complete translation for all navigation items, dashboard cards, forms, tables, status badges, buttons, and error messages

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://arch-dash-flow.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7b4830da-d58a-48ba-a5ac-5336621a5d5e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
