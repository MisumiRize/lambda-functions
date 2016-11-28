LISTFUNCTIONS := find . -type d -not -name .git -not -name . -maxdepth 1

lint:
	$(LISTFUNCTIONS) | xargs -I % bash -c 'cd %; npm run lint;'

.PHONY: lint
