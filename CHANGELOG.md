## [1.3.1](https://github.com/Vedant1202/work-summarizer/compare/v1.3.0...v1.3.1) (2026-05-24)
# [1.3.0](https://github.com/Vedant1202/work-summarizer/compare/v1.2.0...v1.3.0) (2026-05-24)
# [1.2.0](https://github.com/Vedant1202/work-summarizer/compare/v1.1.3...v1.2.0) (2026-05-24)

# [1.1.0](https://github.com/Vedant1202/daily-commit-summarizer/compare/v1.0.0...v1.1.0) (2026-05-24)


### Features

* add OpenAI-compatible LLM provider plugin with multi-model support ([57b6553](https://github.com/Vedant1202/daily-commit-summarizer/commit/57b6553ce1b2d7bd5cd2b13a486cdeb4ee279f32))
* separate AI agent vs human commits in stand-up reports ([3d27380](https://github.com/Vedant1202/daily-commit-summarizer/commit/3d273809886adb1ed1807097f79fbc084f6075de))

# [1.0.0](https://github.com/Vedant1202/daily-commit-summarizer/compare/v0.3.0...v1.0.0) (2026-05-20)


### Features

* pluggable LLM providers and Mustache prompt templates ([9feae01](https://github.com/Vedant1202/daily-commit-summarizer/commit/9feae01b8d95e998eaba19b94396840de6a964e0))

# [0.3.0](https://github.com/Vedant1202/daily-commit-summarizer/compare/v0.2.2...v0.3.0) (2026-05-19)

## [0.2.2](https://github.com/Vedant1202/daily-commit-summarizer/compare/v0.2.1...v0.2.2) (2026-05-19)

## [0.2.1](https://github.com/Vedant1202/daily-commit-summarizer/compare/1aa62175bc0e17411165e21f87c7e8d0914fd881...v0.2.1) (2026-05-18)


### Bug Fixes

* **cli:** print statusId in polling output; replace --no-poll with --fire-and-forget ([b3a1846](https://github.com/Vedant1202/daily-commit-summarizer/commit/b3a1846bad7e22efb00bef385a597d86b8035f35))
* **config:** load .env from global ~/.daily-summary/ in addition to cwd ([56f553e](https://github.com/Vedant1202/daily-commit-summarizer/commit/56f553ec640b97ab846918e5f8ce6e01c04270d4))
* **docs:** correct GitHub org/repo name in Docusaurus config and README ([1b4ba0e](https://github.com/Vedant1202/daily-commit-summarizer/commit/1b4ba0e02c0567bd8028baae4df9d6fd57e07c8b))
* **mintlify:** show LLM summary even when Mintlify API omits commit data ([f692c14](https://github.com/Vedant1202/daily-commit-summarizer/commit/f692c14bed36518a48339e8c269239bfc563f0c6))
* **reports:** key selection by filePath instead of date ([e8b9cfc](https://github.com/Vedant1202/daily-commit-summarizer/commit/e8b9cfc6fb43e510a63d83841a94d4a2fe748940))
* **ui:** pre-populate run options from config and fix report rendering ([7817506](https://github.com/Vedant1202/daily-commit-summarizer/commit/7817506d5ba54141342be5191b51a675f9e09818))


### Features

* add .env file support and refactor git log delimiters to use hex-encoded null bytes ([fc20878](https://github.com/Vedant1202/daily-commit-summarizer/commit/fc20878acac219b1a9ac9374e1b8806013a0908e))
* add $EDITOR review helper for report editing ([c43c860](https://github.com/Vedant1202/daily-commit-summarizer/commit/c43c86004aa440917d97c46266b475683abe6710))
* add commit categorization and path filtering to normalizer ([fc9af59](https://github.com/Vedant1202/daily-commit-summarizer/commit/fc9af5950fc1870f2d69698b40726530fc69a0e4))
* add diagnostic doctor command to verify environment and API connections ([3454958](https://github.com/Vedant1202/daily-commit-summarizer/commit/34549584d28f06634f41f029aab6c226231d6896))
* add diff normalizer with noise filtering and token budget cap ([4a62e48](https://github.com/Vedant1202/daily-commit-summarizer/commit/4a62e48279f5c286178caf813dcb7e1ed4d72c5d))
* add Gemini LLM provider and summarization prompt templates ([3ca6f0b](https://github.com/Vedant1202/daily-commit-summarizer/commit/3ca6f0b8d06f29b6586d34659ec7a2386dc26494))
* add GitHub Action to automate NPM package publication on release ([5e09d01](https://github.com/Vedant1202/daily-commit-summarizer/commit/5e09d0177f6f3f87b3dc32e927dd888ad2572a8e))
* add Linear integration support including issue reference extraction and configuration management ([01ff81f](https://github.com/Vedant1202/daily-commit-summarizer/commit/01ff81f4c93f4aab125cdcaf8cc0d4a5c4759e66))
* add LINEAR_API_KEY to environment configuration template ([9abd923](https://github.com/Vedant1202/daily-commit-summarizer/commit/9abd92389e8a85ef79f08ed904920e553a0b1651))
* add Mintlify integration for documentation deployment and status tracking ([6160db2](https://github.com/Vedant1202/daily-commit-summarizer/commit/6160db2faa1aa6359691cd5a12e1c6d0a0f0f24c))
* add report generator and Markdown exporter ([d96f4b1](https://github.com/Vedant1202/daily-commit-summarizer/commit/d96f4b1e57a3b3b12fce6e2582bbf30fc91227b8))
* **cli:** add --repo flag to run and docs commands ([d45c9f7](https://github.com/Vedant1202/daily-commit-summarizer/commit/d45c9f75eb02a93e1d13cd60d43e23f93685f237))
* **cli:** add --with-linear flag to run command ([1b27d75](https://github.com/Vedant1202/daily-commit-summarizer/commit/1b27d756920a536acb134e5fea02a264f5d7c072))
* **cli:** add config init wizard ([cefa49f](https://github.com/Vedant1202/daily-commit-summarizer/commit/cefa49fa43f99a13115a15d8462d43d6699e7802))
* **cli:** add doctor command for config validation and API connectivity ([1c69c41](https://github.com/Vedant1202/daily-commit-summarizer/commit/1c69c415eafd3be7da29a815f68b7eccdefa83cc))
* **cli:** add mintlify subcommand group (trigger, status, history) ([3ae2cd5](https://github.com/Vedant1202/daily-commit-summarizer/commit/3ae2cd5cafd88358f18a42e84b0ba73926c1409e))
* **cli:** add mintlify summary subcommand for deployment docs changelog ([7a5973d](https://github.com/Vedant1202/daily-commit-summarizer/commit/7a5973ddfd59aa391ca8c322386a6409e0581dd9))
* **config:** add Mintlify and Linear API key fields to Config page ([c7aceda](https://github.com/Vedant1202/daily-commit-summarizer/commit/c7acedad281b42901ed4930b53ec0aae4c2798b4))
* **config:** add Mintlify integration config with env var support ([1d3fb90](https://github.com/Vedant1202/daily-commit-summarizer/commit/1d3fb90ca1fe29ba7667a0b512d6a9fb368a3aab))
* **docs:** add --create-issues flag to docs command ([5f6981e](https://github.com/Vedant1202/daily-commit-summarizer/commit/5f6981e79d399622dcf1635873de70af84e59f79))
* **docs:** add pushToDocsRepo() and docs push subcommand ([f92f53a](https://github.com/Vedant1202/daily-commit-summarizer/commit/f92f53ad9b99d1907cac5303f1f0e84dbb778a0b))
* **docs:** scaffold Docusaurus v3 site with homepage and theme ([c899b8b](https://github.com/Vedant1202/daily-commit-summarizer/commit/c899b8b92bb508fa8dc9ae5e95ab15c2b5d3306e))
* **doctor:** add optional Mintlify config checks to doctor command ([abce7cf](https://github.com/Vedant1202/daily-commit-summarizer/commit/abce7cf37746a872f68fd5b2d6765fc8c75bc170))
* implement run, export, and config CLI commands ([6e88456](https://github.com/Vedant1202/daily-commit-summarizer/commit/6e88456d191c131cf6cb6fcb7669d353c48f0f2a))
* include time in report filenames, expose in API ([23ac858](https://github.com/Vedant1202/daily-commit-summarizer/commit/23ac8584bc547c520437030a8785b743b85a546d))
* **integrations:** add LinearIntegrationClient wrapping @linear/sdk ([c8e3833](https://github.com/Vedant1202/daily-commit-summarizer/commit/c8e38338582832cb7ae6158cc7ced3b7f063a93e))
* **integrations:** add Mintlify deploy client, types, and deployment cache ([7640471](https://github.com/Vedant1202/daily-commit-summarizer/commit/76404710a0b550320e718291bf837ab766e1f477))
* make Gemini model configurable via environment variable ([e02c333](https://github.com/Vedant1202/daily-commit-summarizer/commit/e02c3339e2d1ecf4511b095dac38c1475bbf069e))
* make Gemini model configurable via environment variable ([1b8bedb](https://github.com/Vedant1202/daily-commit-summarizer/commit/1b8bedb2473d6e9cd3c8abe858accae0f82772c3))
* **mintlify:** add filterRecordsSince and deployment summary LLM prompt ([a2630a3](https://github.com/Vedant1202/daily-commit-summarizer/commit/a2630a3c55d4d1fbeba39206073d10da493b92ef))
* **mintlify:** save statusId immediately on trigger and add to history ([3524e82](https://github.com/Vedant1202/daily-commit-summarizer/commit/3524e823c37dea51d4fe6274b724073f58509baa))
* Phase 2 — HTML export, report history, scheduler, and path filters ([4e87ab8](https://github.com/Vedant1202/daily-commit-summarizer/commit/4e87ab80871ef22d31e2fb20d04f2b7171d93821))
* Phase 3 — documentation intelligence with heuristic detection and review UI ([e9f29fd](https://github.com/Vedant1202/daily-commit-summarizer/commit/e9f29fdf927eb58bc6e5edf3561dabe11db2e8e8))
* **report:** add Docs Impact section using existing DocSignal detection ([f84e6af](https://github.com/Vedant1202/daily-commit-summarizer/commit/f84e6af82dbaf197bee1941814bb5c653bd7d92b))
* **report:** add ticket-grouped section for Linear issues ([02d1add](https://github.com/Vedant1202/daily-commit-summarizer/commit/02d1addd9f4a87e9f8c9cf6a2d29f956e4d1f432))
* rewrite summarization prompt for professional stand-up quality ([9b6c4f1](https://github.com/Vedant1202/daily-commit-summarizer/commit/9b6c4f16db7d40b977d64a1d81e4a8905a4aef91))
* scaffold Phase 1 project and implement config + git ingestion ([1aa6217](https://github.com/Vedant1202/daily-commit-summarizer/commit/1aa62175bc0e17411165e21f87c7e8d0914fd881))
* **ui/mintlify:** save pending record on trigger, add statusId to history table ([1d478fd](https://github.com/Vedant1202/daily-commit-summarizer/commit/1d478fd6305f5e8ef3c8fa392d32ccc5a7cfdc79))
* **ui:** add live date/time clock to sidebar navbar ([712a66d](https://github.com/Vedant1202/daily-commit-summarizer/commit/712a66d71583b8b2fad866f5fbcf50a5ea78496e))
* **ui:** add Mintlify integration page ([8a3934e](https://github.com/Vedant1202/daily-commit-summarizer/commit/8a3934e2160c72dc1433ac48abdb58810355ff1e))
* **ui:** add web UI server with Express backend and React frontend ([cde8b94](https://github.com/Vedant1202/daily-commit-summarizer/commit/cde8b945409fcf2b81b1292673607e1fa60a09ec))
* **ui:** apply minimal blue accent theme across all pages ([711733b](https://github.com/Vedant1202/daily-commit-summarizer/commit/711733b4015561cbb68e37763a602f577968e7e0)), closes [#0f172a](https://github.com/Vedant1202/daily-commit-summarizer/issues/0f172a) [#2563eb](https://github.com/Vedant1202/daily-commit-summarizer/issues/2563eb) [#94a3b8](https://github.com/Vedant1202/daily-commit-summarizer/issues/94a3b8) [#f8fafc](https://github.com/Vedant1202/daily-commit-summarizer/issues/f8fafc) [#111](https://github.com/Vedant1202/daily-commit-summarizer/issues/111) [#2563eb](https://github.com/Vedant1202/daily-commit-summarizer/issues/2563eb) [#ccc](https://github.com/Vedant1202/daily-commit-summarizer/issues/ccc) [#cbd5e1](https://github.com/Vedant1202/daily-commit-summarizer/issues/cbd5e1) [#e5e5e5](https://github.com/Vedant1202/daily-commit-summarizer/issues/e5e5e5) [#e2e8f0](https://github.com/Vedant1202/daily-commit-summarizer/issues/e2e8f0) [#276749](https://github.com/Vedant1202/daily-commit-summarizer/issues/276749)
* **ui:** expose run options panel in Dashboard ([1b98e1d](https://github.com/Vedant1202/daily-commit-summarizer/commit/1b98e1d15d993a6ed21577b81bb975f4aaa01992))
* **ui:** rework Reports page with day-grouping, search, and accordion ([72b50be](https://github.com/Vedant1202/daily-commit-summarizer/commit/72b50be1f3a6a7914d9e33ec74e3e9d3fda6356b))
