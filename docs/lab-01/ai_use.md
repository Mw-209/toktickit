# Lab 1 — AI Use and Reflection  (fill this in)

**LLM/agent used:** <Claude AI>

## Selected key prompts (6–10)
| # | Prompt (summarised) | What I did with the result |
|---|---------------------|----------------------------|
| 1 | Help me set up the Git repo — I cloned into an existing folder and got errors | Followed the steps to fix the clone, made my first commit, and pushed to GitHub |
| 2 | Write README.md with setup instructions for the project | Checked the generated README, made sure the instructions matched our actual project structure |
| 3 | What do I need to change for Issue 2 health check endpoint? | AI pointed me to the exact line in app.ts to change from 501 to 200 with the correct JSON response |
| 4 | The health test still returns 501 after I edited the file | Realized my changes were lost when switching branches, re-applied the fix and ran npm test to confirm it passed |
| 5 | Why does `npx prisma migrate dev` give a P1001 Error: Can't reach database server at localhost:5432? | The AI realized my PostgreSQL was running in Docker on port 15432 instead of 5432. It updated my `.env` file to use the correct port and `root` credentials, and ran the migration for me. |
| 6 | Are these database installation steps what I need to do for Issue 3? | The AI clarified that installing the database is just the prerequisite setup. It explained that the actual Issue 3 involves writing the `Category` model in `schema.prisma` and adding seed data in `seed.ts`. |
| 7 | How can I verify that running `npx prisma db seed` twice doesn't create duplicate categories? | The AI explained that the `upsert` function in the seed script prevents duplicates. It then ran the seed command a second time to prove that it passes the reviewer's requirements. |
| 8 | Implement the GET /api/categories endpoint following the TODO comments in app.ts | AI added the route using `prisma.category.findMany()` with `select` for id and name, ordered by id, and proper error handling returning 500 on failure |
| 9 | Write the frontend to fetch and display categories when clicking Check System, including loading and error states | AI updated `api.ts` to fetch `/api/categories` after the health check, and updated `App.tsx` to render the category list on success or show "Offline" on failure |
| 10 | The page shows "Offline" even though the code looks correct — what's wrong? | AI discovered the backend server had crashed after switching git branches. Running `npx prisma generate` to regenerate the Prisma client and restarting the server fixed it |



## Reflection
Two or three sentences: what made your prompts better, and one place you had to
correct or reject what the agent produced.
