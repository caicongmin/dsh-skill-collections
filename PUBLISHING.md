# Publishing a release

The public npm package is **`dsh-skill-collections`**. The repository keeps the private development package name `@dsh-external/dsh-skill-collections`; the release script generates the public package with matching loader and browser module identities.

## Prepare the package

Update `package.json.version` and `CHANGELOG.md`, then run these commands from the plugin directory with `DSH_CHECKOUT` pointing to the DSH checkout:

```bash
npm run build
npm run build:client
npm test
npm run pack:npm
```

The output is `release/dsh-skill-collections-<version>.tgz` and its `.sha256` checksum. The archive includes prebuilt Host/browser code, the loader patch, both READMEs, and screenshot assets. Consumers do not run a build.

`pack:npm` checks the archive's runtime files, dependencies, loader entry, and browser module ID. It generates the public client in a temporary directory without replacing the local development client bundle.

## Publish to npm

Use an npm account with permission to publish this package:

```bash
npm login --registry=https://registry.npmjs.org/
npm publish ./release/dsh-skill-collections-<version>.tgz --access public --registry=https://registry.npmjs.org/
```

Replace `<version>` with the actual version. Publish the generated archive, not the private repository root. The archive can be transferred to another machine and published there without installing the source dependencies. On Windows, `npm.cmd` can be used in place of `npm`.

Complete any account verification through npm's official browser flow. If npm accepts the upload and reports asynchronous processing, allow processing to finish before checking availability; an immediate query can temporarily return 404.

## Verify availability

```bash
npm view dsh-skill-collections@<version> version dist.integrity --prefer-online --registry=https://registry.npmjs.org/
```

Confirm that the published archive matches the generated artifact. Packaging does not publish automatically or create a Git tag/Release.

## Install

```bash
dsh plugin --profile web add dsh-skill-collections
```

Restart DSH after installation or an update. To test an unpublished archive, pass its absolute `.tgz` path to the same command. Do not enable both the source development package and the npm package in the same Profile.
