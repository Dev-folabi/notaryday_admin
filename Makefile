.PHONY: install dev build start lint typecheck git-status git-log git-pull git-commit git-push

install:
	npm install

dev:
	npm run dev

build:
	npm run build

start:
	npm run start

lint:
	npm run lint

typecheck:
	npx tsc --noEmit

git-status:
	git status

git-log:
	git log --oneline -20

git-pull:
	git pull

git-commit:
	git add -A
	git commit -m "$(msg)"

git-push:
	git push
