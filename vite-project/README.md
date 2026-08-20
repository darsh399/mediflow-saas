# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Added Setup Notes

This project now includes example Redux and Zod setup to help get started quickly.

- Install dependencies:

```bash
cd "c:\\Users\\sudar\\OneDrive\\Desktop\\New programs\\vite-project"
npm install
```

- Start the dev server:

```bash
npm run dev
```

- Key files added:

- `src/store/store.js` - Redux store configured with `@reduxjs/toolkit`.
- `src/store/postsSlice.js` - Example posts slice.
- `src/utils/postSchema.js` - Example Zod schema and `validatePost` helper.

If you prefer to keep using the existing `SocialContextProvider`, both Context and Redux are provided side-by-side in `src/main.jsx`.

If you run into peer dependency issues during `npm install`, ensure React is v18 (this project uses `react@^18.2.0`).
