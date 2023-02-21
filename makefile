.PHONY: build help

help:
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

install: ## Install all dependencies
	yarn

build-ra-auth-msal:
	@echo "Transpiling ra-auth-msal files...";
	@cd ./packages/ra-auth-msal && yarn build

build-demo-react-admin:
	@echo "Transpiling demo files...";
	@cd ./packages/demo-react-admin && yarn build

build: build-ra-auth-msal build-demo-react-admin ## compile ES6 files to JS

start: ## Start the demo
	@cd ./packages/demo-react-admin && yarn start

publish: ## Publish the package
	cd packages/ra-auth-masl && npm publish