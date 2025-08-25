Travel Budget Planner
Introduction

Travel Budget Planner is a smart and easy-to-use web app designed to help travelers plan, manage, and track their trip expenses in one place. It allows users to log in securely, set trip budgets, record expenses by category, track remaining balances, visualize spending with charts, and export data in CSV/PDF formats.

This project solves the problem of overspending while traveling by providing clear insights into expenses with multi-currency support, dark mode, and real-time charts.

Project Type

Frontend (React + Firebase)

Deployed App

Frontend: https://unit-4-build-week.vercel.app/


Backend: N/A (Firebase Authentication used)

Database: LocalStorage (per-user data persistence)

Directory Structure
my-app/
├─ src/
│  ├─ App.jsx
│  ├─ firebaseConfig.js
│  ├─ index.css
│  └─ main.jsx
├─ public/
├─ package.json
└─ README.md

Video Walkthrough of the Project

(https://youtu.be/pkhFp__HxH4)

Features

🔑 User Authentication – Secure login/register with Firebase

🌙 Dark Mode / Light Mode – User preference stored in localStorage

💱 Multi-Currency Support – Live exchange rates via ExchangeRate API

📊 Expense Tracking – Categorized expenses with notes & dates

🧮 Budget Management – Set budgets and track remaining balance

📈 Charts & Analytics – Pie chart (by category) + Bar chart (monthly spend)

📝 Edit / Delete Expenses – Manage and update records

💾 Local Persistence – Saves expenses and budgets per user in localStorage

📤 Export Options – Download expenses as CSV or PDF

🖥️ Responsive UI – Built with Tailwind CSS, mobile-friendly

Design Decisions & Assumptions

Used Firebase Authentication (no custom backend needed).

Chose localStorage for storing user expenses (simple & fast for demo scale).

Default budget set to ₹50,000 INR per new user (editable).

Exchange rates fetched every 30 minutes using exchangerate.host.

Focused on clean UX: minimal clicks, instant feedback, responsive layout.

Installation & Getting Started

Clone the repository:

git clone https://github.com/your-username/travel-budget-planner.git
cd travel-budget-planner


Install dependencies:

npm install


Run locally:

npm run dev


Build for production:

npm run build

Usage

Register/Login using email & password.

Set a budget in your preferred currency.

Add expenses with category, date, and optional notes.

View analytics with interactive pie & bar charts.

Export reports as CSV or PDF.

Switch between Dark & Light mode anytime.

Credentials (Demo Users)
Email: demo@example.com
Password: 123456

APIs Used

Firebase Authentication – for secure login/register

ExchangeRate API (https://api.exchangerate.host
) – for multi-currency conversion

API Endpoints (External)

GET https://api.exchangerate.host/latest?base=INR → Retrieves currency conversion rates

Technology Stack

React.js (Vite) – Frontend framework

Tailwind CSS – Styling & responsive UI

Firebase Authentication – User login/register

LocalStorage – Per-user budget & expenses persistence

ApexCharts – Charts & analytics

jsPDF + jsPDF-AutoTable – Export reports as PDF
