# Login Credentials

## Student Account

- **Email:** `student@fti.edu.al`
- **Password:** `password123`
- **Role:** student

## Professor Account

- **Email:** `professor@fti.edu.al`
- **Password:** `professor123`
- **Role:** professor

---

## How to Login

1. Go to `http://localhost:3000/login` (or `http://localhost:3001/login` if port 3000 is in use)
2. Enter your email and password from above
3. Click the Login button

## Notes

- Only `@fti.edu.al` email addresses are accepted
- Passwords must be at least 6 characters
- JWT tokens expire after 7 days
- You can add more users through the database with `npm run db:seed`
