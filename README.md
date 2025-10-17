This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.



# Take-at-Home Task - Frontend Engineer (KB)

Congrats on making it thus far in the interview process for [Stack AI](https://stack.ai/)!

Here is a **2-day task** for you to show us where you shine the most 🙂

## 🥅 Goal

The goal of this task is to build a custom File Picker, similar to the one below, for a Google Drive connection:

![image (42).png](https://prod-files-secure.s3.us-west-2.amazonaws.com/ef4fb1f8-e7c2-460e-882d-3ca0541f45cf/26ba3803-ec4f-4bd3-8b08-657182c308ff/image_(42).png)

- The functionality should be very similar to the one in your computer to manage your  filesystem (e.g. Finder on MacOS). Here are some of the actions you need to perform:
    - **Read**: read the files and folders from the database that are in the Google Drive connection:
        - Mind that this is like the same functionality as in `ls` in your terminal, meaning, the API is done so that you have to specify which “folder” you want to read, and list the subsequent files/folders.
    - **Delete**: the ability to remove a file from the list of files indexed (mind that this does NOT delete the file in Google Drive, but instead de-indexes the file).
    - **Create/Update**: you do **not** need to perform these actions.
- Now, there is one more thing! The File Picker is meant to be used for **selecting and indexing** files to build Knowledge Bases (see API docs below) of a subset of files/folders, and as such, we want the user to be able to:
    - Select a file or entire folder and index it (see API endpoints in jupyter notebook below).
    - Provide information about whether the file is:
        - indexed
        - not indexed
        - being indexed
    - Allow the user to de-index a file (without necessarily deleting the file), and show the user when the file has been de-index.
- Finally, we care about the UI being snappy and fast, meaning, don’t put loading spinners everywhere 🌀.🌀:
    - Use skeletons for loading states
    - Wherever possible, pre-fetch information so that you minimize user’s waiting time
        - BUT do not fetch all the files at once, since that isn’t scalable.
        - a good balance between pre-fetching and skeletons as loading states, should make the file picking and indexing experience delightful.
    - Make use of **Optimistic UI** updates as much as possible, [read SWR to learn more](https://swr.vercel.app/blog/swr-v2.en-US#optimistic-ui), and rollback on errors and show the user what happened when doing so. Use [toasts](https://ui.shadcn.com/docs/components/sonner) for example to show the error.
- Bonus points:
    - Sorting:
        - By name
        - By date
    - Filtering:
        - By name
    - Searching:
        - By name
    

## 📔 Resources:

- Here is a jupyter notebook for you to see how to use the API endpoints:
    - To run and visualize this notebook in VSCode: install Jupyter Notebook extension.
    
    ![image.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/ef4fb1f8-e7c2-460e-882d-3ca0541f45cf/12f49411-aab8-4e41-99da-91fa74080b70/image.png)
    
    [Knowledge_Base_Workflow.ipynb](attachment:321bfa0a-53f4-4dbd-81e7-b77f3aa09ce1:Knowledge_Base_Workflow.ipynb)
    
    > Make sure to save the file as a `.ipynb` notebook
    > 
- Credentials to log into Google Drive, and to log into Stack AI.
- You will be asked for the password below inside the jupyter notebook:
    - Email: [stackaitest@gmail.com](mailto:stackaitest@gmail.com)
    - Password: !z4ZnxkyLYs#vR

These are used for:

- Logging into Google Drive
- Accessing a StackAI account created for this task, with a Google Drive connection already created. DO NOT DELETE OR ADD NEW GOOGLE DRIVE ACCOUNTS.

> ⚠️ If you are asked for two factor authentication to log in with that email. Ping [arosinol@stack-ai.com](mailto:arosinol@stack-ai.com) (+18575295760, whatsapp/sms works) and/or your point of contact at Stack AI.
> 

## ⚒️ **Tech Stack**

- **Framework**: React + Next.js (latest stable version)
- **Data Fetching**: Tanstack Query
- **State Management**: Zustand (if really needed)
- **Styling**: Tailwind CSS (latest stable version)
- **Components library**: [Shadcn](https://ui.shadcn.com/)

## 📓 Evaluation Criteria

We will look at the code and UI/UX's quality.

🎼 **Code quality:**

- Reusing React components
- Use of **custom hooks**
- Use of comments wherever necessary
- Proper typing of variables
- React’s good practices
- Proper use of `useEffect`
- Minimizing unnecessary re-renders.
- Next.js good practices

🖥️ **UI/UX quality:**

- Does everything work as expected? Are there any console errors or broken features?
- Is it fast? Do you have to wait for the UI? Does it make good use of optimistic updates? Do you rollback on errors?
- Is it intuitive?
- Does it look visually appealing?
- Low Cumulative Layout Shift? Do things move around when clicking something (this is bad)? [Learn more about CLS](https://vercel.com/docs/speed-insights/metrics#cumulative-layout-shift-cls)

## 🔖 Deliverable

1. **Source Code**: A link to a GitHub repository containing all your source code.
2. **Live Demo**: A link to a live demo of the page **hosted on Vercel.**
    1. **Demo video**: a screen recording of your design with an explanation of your design choices and thoughts/problem-solving.
    2. **Website link**: to a Vercel-hosted website
3. **Documentation**: A README file that explains your technical choices, how to run the project locally, and any other relevant information.

## 🕰️ Timeline

You have **2 days** (48h) from the receipt of this test to submit your deliverables 🚀

## ❓Questions

Feel free to reach out at any given point with questions about the task, particularly if you encounter problems outside of your control that may block your progress.

Reach out to your main point of contact at Stack AI, and, if in doubt, email [arosinol@stack-ai.com](mailto:arosinol@stack-ai.com) or text (+18575295760, whatsapp/sms works).











