Deployment to GitHub Pages (docs folder)

1) Build into `docs/` (so Pages can serve from the `docs` folder):

   npm run build:docs

2) Commit and push the `docs/` folder to your default branch (e.g., `main`):

   git add docs && git commit -m "chore: build docs" && git push

3) In your GitHub repo settings → Pages (or Code and automation → Pages):
   - Source: choose `main` branch / `docs` folder
   - If using a custom domain (czarneprzemyskie.pl), set it in the Pages settings

Notes:
- Vite `base: './'` is already set to ensure built asset paths are relative.
- A `docs/.nojekyll` file is included so GitHub Pages won't try to process files with Jekyll.

Alternative: use `gh-pages` or GitHub Actions to automate builds and deployments.
