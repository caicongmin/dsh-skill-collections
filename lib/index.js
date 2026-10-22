import { copyFile, cp, lstat, mkdir, readFile, readdir, readlink, realpath, rename, rm, stat, symlink, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { parse, stringify } from "yaml";
//#region src/core.ts
const SKILL_NAME = /^[a-z0-9][a-z0-9-]*$/;
const COLLECTION_ID = /^[a-z0-9][a-z0-9-]*$/;
const WORKSPACE_CONFIG_FILE = "skill-collections.yml";
const WORKSPACE_MANIFEST_FILE = "skill-collections.manifest.json";
const GLOBAL_MANIFEST_FILE = "global-links.manifest.json";
const MAX_UPLOAD_FILES = 500;
const MAX_UPLOAD_FILE_BYTES = 4 * 1024 * 1024;
const MAX_UPLOAD_TOTAL_BYTES = 12 * 1024 * 1024;
const EMPTY_CONFIG = {
	version: 1,
	collections: [],
	skills: {
		enabled: [],
		disabled: []
	}
};
function uniqueSorted(values) {
	return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}
function asRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value) ? value : void 0;
}
function stringArray(value) {
	if (!Array.isArray(value)) return [];
	return uniqueSorted(value.filter((entry) => typeof entry === "string" && entry.length > 0));
}
function requireSafeId(value, pattern, label) {
	if (!pattern.test(value)) throw new Error(`${label} ${JSON.stringify(value)} must use lowercase kebab-case`);
}
function assertContained(root, target, label) {
	const rel = relative(resolve(root), resolve(target));
	if (rel === "" || rel.startsWith("..") || isAbsolute(rel)) throw new Error(`${label} escapes its managed root`);
}
async function exists(path) {
	try {
		await lstat(path);
		return true;
	} catch (error) {
		if (error.code === "ENOENT") return false;
		throw error;
	}
}
async function atomicWrite(path, content) {
	await mkdir(dirname(path), { recursive: true });
	const temporary = `${path}.tmp-${process.pid}-${Date.now()}`;
	await writeFile(temporary, content, {
		encoding: "utf8",
		flag: "wx",
		mode: 384
	});
	await rename(temporary, path);
}
function normalizeUploadPath(path) {
	if (path.includes("\0") || isAbsolute(path)) return void 0;
	const segments = path.split(/[\\/]+/);
	if (segments.length === 0 || segments.some((segment) => segment === "" || segment === "." || segment === "..")) return void 0;
	return join(...segments);
}
function decodeBase64(content) {
	if (content.length === 0 || content.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(content)) return void 0;
	try {
		const bytes = Buffer.from(content, "base64");
		return bytes.toString("base64").replace(/=+$/, "") === content.replace(/=+$/, "") ? bytes : void 0;
	} catch {
		return;
	}
}
function parseFrontmatter(content) {
	const match = content.replace(/^\uFEFF/, "").match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);
	if (match === null) return void 0;
	try {
		return asRecord(parse(match[1]));
	} catch {
		return;
	}
}
async function readSkill(path, fallbackName, layout) {
	const entry = layout === "directory" ? join(path, "SKILL.md") : path;
	let content;
	try {
		content = await readFile(entry, "utf8");
	} catch {
		return;
	}
	const frontmatter = parseFrontmatter(content);
	const name = typeof frontmatter?.name === "string" ? frontmatter.name.trim() : fallbackName;
	const description = typeof frontmatter?.description === "string" ? frontmatter.description.trim() : "";
	if (!SKILL_NAME.test(name) || name !== fallbackName || description.length === 0) return void 0;
	const entryStat = await lstat(path);
	let linkTarget;
	if (entryStat.isSymbolicLink()) try {
		linkTarget = await readlink(path);
	} catch {}
	return {
		name,
		description,
		path,
		layout,
		isSymlink: entryStat.isSymbolicLink(),
		...linkTarget === void 0 ? {} : { linkTarget }
	};
}
function resolvePaths(dshHome) {
	const home = resolve(dshHome ?? process.env.DSH_HOME ?? join(homedir(), ".dsh"));
	const root = join(home, "skill-collections");
	return {
		dshHome: home,
		root,
		library: join(root, "library"),
		collections: join(root, "collections"),
		globalSkills: join(home, "skills")
	};
}
async function scanSkills(root) {
	let entries;
	try {
		entries = await readdir(root, { withFileTypes: true });
	} catch (error) {
		if (error.code === "ENOENT") return [];
		throw error;
	}
	const found = [];
	for (const entry of entries) {
		if ((entry.isDirectory() || entry.isSymbolicLink()) && SKILL_NAME.test(entry.name)) {
			const skill = await readSkill(join(root, entry.name), entry.name, "directory");
			if (skill !== void 0) found.push(skill);
			continue;
		}
		if ((entry.isFile() || entry.isSymbolicLink()) && entry.name.endsWith(".md")) {
			const name = entry.name.slice(0, -3);
			if (!SKILL_NAME.test(name)) continue;
			const skill = await readSkill(join(root, entry.name), name, "file");
			if (skill !== void 0) found.push(skill);
		}
	}
	return found.sort((left, right) => left.name.localeCompare(right.name));
}
async function readCollections(paths) {
	const skills = new Set((await scanSkills(paths.library)).map((skill) => skill.name));
	let entries;
	try {
		entries = await readdir(paths.collections, { withFileTypes: true });
	} catch (error) {
		if (error.code === "ENOENT") return [];
		throw error;
	}
	const collections = [];
	for (const entry of entries) {
		if (!entry.isFile() || !entry.name.endsWith(".yml")) continue;
		const id = entry.name.slice(0, -4);
		if (!COLLECTION_ID.test(id)) continue;
		let value;
		try {
			value = asRecord(parse(await readFile(join(paths.collections, entry.name), "utf8")));
		} catch {
			continue;
		}
		if (value === void 0 || value.version !== 1 || value.id !== id) continue;
		const name = typeof value.name === "string" && value.name.trim().length > 0 ? value.name.trim() : id;
		const description = typeof value.description === "string" ? value.description.trim() : "";
		const members = stringArray(value.skills).filter((skill) => SKILL_NAME.test(skill));
		collections.push({
			id,
			name,
			description,
			skills: members,
			missingSkills: members.filter((skill) => !skills.has(skill))
		});
	}
	return collections.sort((left, right) => left.name.localeCompare(right.name) || left.id.localeCompare(right.id));
}
async function saveCollection(paths, input) {
	requireSafeId(input.id, COLLECTION_ID, "collection id");
	if (input.name.trim().length === 0 || input.name.length > 120) throw new Error("collection name must be 1-120 characters");
	const skills = uniqueSorted(input.skills);
	const available = new Set((await scanSkills(paths.library)).map((skill) => skill.name));
	for (const skill of skills) {
		requireSafeId(skill, SKILL_NAME, "skill name");
		if (!available.has(skill)) throw new Error(`skill ${JSON.stringify(skill)} is not installed in the managed library`);
	}
	const collection = {
		id: input.id,
		name: input.name.trim(),
		description: input.description?.trim() ?? "",
		skills,
		missingSkills: []
	};
	await atomicWrite(join(paths.collections, `${input.id}.yml`), stringify({
		version: 1,
		id: collection.id,
		name: collection.name,
		description: collection.description,
		skills: [...collection.skills]
	}, { lineWidth: 0 }));
	return collection;
}
async function removeCollection(paths, id) {
	requireSafeId(id, COLLECTION_ID, "collection id");
	const target = join(paths.collections, `${id}.yml`);
	assertContained(paths.collections, target, "collection path");
	await rm(target, { force: true });
}
async function readWorkspaceConfig(workspace) {
	const path = join(workspace, ".dsh", WORKSPACE_CONFIG_FILE);
	let value;
	try {
		value = asRecord(parse(await readFile(path, "utf8")));
	} catch (error) {
		if (error.code === "ENOENT") return EMPTY_CONFIG;
		throw new Error(`cannot read workspace collection config ${path}: ${String(error)}`, { cause: error });
	}
	if (value === void 0 || value.version !== 1) throw new Error(`workspace collection config ${path} must have version: 1`);
	const skillFields = asRecord(value.skills);
	return {
		version: 1,
		collections: stringArray(value.collections).filter((id) => COLLECTION_ID.test(id)),
		skills: {
			enabled: stringArray(skillFields?.enabled).filter((name) => SKILL_NAME.test(name)),
			disabled: stringArray(skillFields?.disabled).filter((name) => SKILL_NAME.test(name))
		}
	};
}
async function writeWorkspaceConfig(workspace, config) {
	const target = join(join(workspace, ".dsh"), WORKSPACE_CONFIG_FILE);
	assertContained(workspace, target, "workspace config path");
	await atomicWrite(target, stringify({
		version: 1,
		collections: uniqueSorted(config.collections),
		skills: {
			enabled: uniqueSorted(config.skills.enabled),
			disabled: uniqueSorted(config.skills.disabled)
		}
	}, { lineWidth: 0 }));
}
async function updateWorkspaceCollection(workspace, id, enabled) {
	requireSafeId(id, COLLECTION_ID, "collection id");
	const current = await readWorkspaceConfig(workspace);
	const collections = new Set(current.collections);
	if (enabled) collections.add(id);
	else collections.delete(id);
	const next = {
		...current,
		collections: uniqueSorted([...collections])
	};
	await writeWorkspaceConfig(workspace, next);
	return next;
}
async function updateWorkspaceSkill(workspace, name, mode) {
	requireSafeId(name, SKILL_NAME, "skill name");
	const current = await readWorkspaceConfig(workspace);
	const enabled = new Set(current.skills.enabled);
	const disabled = new Set(current.skills.disabled);
	enabled.delete(name);
	disabled.delete(name);
	if (mode === "enable") enabled.add(name);
	if (mode === "disable") disabled.add(name);
	const next = {
		...current,
		skills: {
			enabled: uniqueSorted([...enabled]),
			disabled: uniqueSorted([...disabled])
		}
	};
	await writeWorkspaceConfig(workspace, next);
	return next;
}
async function desiredSkills(paths, config) {
	const library = new Map((await scanSkills(paths.library)).map((skill) => [skill.name, skill]));
	const collections = new Map((await readCollections(paths)).map((collection) => [collection.id, collection]));
	const desired = /* @__PURE__ */ new Map();
	const add = (name, source) => {
		const current = desired.get(name) ?? {
			skill: library.get(name),
			sources: []
		};
		current.sources.push(source);
		desired.set(name, current);
	};
	for (const id of config.collections) {
		const collection = collections.get(id);
		if (collection === void 0) continue;
		for (const skill of collection.skills) add(skill, `collection:${id}`);
	}
	for (const name of config.skills.enabled) add(name, "workspace:enabled");
	for (const name of config.skills.disabled) desired.delete(name);
	return new Map([...desired].map(([name, value]) => [name, {
		...value,
		sources: uniqueSorted(value.sources)
	}]));
}
function skillTarget(skillsRoot, skill) {
	return join(skillsRoot, skill.layout === "directory" ? skill.name : `${skill.name}.md`);
}
async function readManifest(workspace) {
	const path = join(workspace, ".dsh", WORKSPACE_MANIFEST_FILE);
	try {
		const record = asRecord(JSON.parse(await readFile(path, "utf8")));
		const links = asRecord(record?.links);
		if (record?.version !== 1 || links === void 0) throw new Error("invalid manifest fields");
		const normalized = {};
		for (const [name, raw] of Object.entries(links)) {
			const link = asRecord(raw);
			if (!SKILL_NAME.test(name) || typeof link?.source !== "string" || typeof link.target !== "string") throw new Error(`invalid manifest link ${name}`);
			normalized[name] = {
				source: link.source,
				target: link.target
			};
		}
		return {
			version: 1,
			links: normalized
		};
	} catch (error) {
		if (error.code === "ENOENT") return {
			version: 1,
			links: {}
		};
		throw new Error(`cannot safely read managed-link manifest ${path}: ${String(error)}`, { cause: error });
	}
}
async function sameTarget(left, right) {
	try {
		return await realpath(left) === await realpath(right);
	} catch {
		return false;
	}
}
async function removeManagedLink(link) {
	let targetStat;
	try {
		targetStat = await lstat(link.target);
	} catch (error) {
		if (error.code === "ENOENT") return true;
		throw error;
	}
	if (!targetStat.isSymbolicLink() || !await sameTarget(link.target, link.source)) return false;
	await unlink(link.target);
	return true;
}
const globalMutations = /* @__PURE__ */ new Map();
async function withGlobalMutation(paths, operation) {
	const key = resolve(paths.root);
	const next = (globalMutations.get(key) ?? Promise.resolve()).catch(() => {}).then(operation);
	globalMutations.set(key, next);
	try {
		return await next;
	} finally {
		if (globalMutations.get(key) === next) globalMutations.delete(key);
	}
}
async function readGlobalManifest(paths) {
	const path = join(paths.root, GLOBAL_MANIFEST_FILE);
	try {
		const value = asRecord(JSON.parse(await readFile(path, "utf8")));
		const links = asRecord(value?.links);
		if (value?.version !== 1 || links === void 0) throw new Error("invalid manifest fields");
		const normalized = {};
		for (const [name, raw] of Object.entries(links)) {
			const link = asRecord(raw);
			if (!SKILL_NAME.test(name) || typeof link?.source !== "string" || typeof link.target !== "string") throw new Error("invalid global link");
			const file = link.source === join(paths.library, `${name}.md`);
			if (!file && link.source !== join(paths.library, name) || link.target !== join(paths.globalSkills, file ? `${name}.md` : name)) throw new Error("global link escapes its managed paths");
			normalized[name] = {
				source: link.source,
				target: link.target
			};
		}
		return {
			version: 1,
			links: normalized
		};
	} catch (error) {
		if (error.code === "ENOENT") return {
			version: 1,
			links: {}
		};
		throw new Error(`cannot safely read global-link manifest ${path}: ${String(error)}`, { cause: error });
	}
}
async function writeGlobalManifest(paths, links) {
	await atomicWrite(join(paths.root, GLOBAL_MANIFEST_FILE), `${JSON.stringify({
		version: 1,
		links
	}, null, 2)}\n`);
}
function globalLink(manifest, name) {
	return Object.hasOwn(manifest.links, name) ? manifest.links[name] : void 0;
}
async function ownsGlobalLink(link) {
	try {
		return (await lstat(link.target)).isSymbolicLink() && resolve(dirname(link.target), await readlink(link.target)) === link.source;
	} catch (error) {
		if (error.code === "ENOENT") return false;
		throw error;
	}
}
async function listGlobalSkills(paths) {
	const manifest = await readGlobalManifest(paths);
	return Promise.all((await scanSkills(paths.globalSkills)).map(async (skill) => {
		const link = globalLink(manifest, skill.name);
		return {
			...skill,
			globalManaged: link !== void 0 && link.target === skill.path && await ownsGlobalLink(link)
		};
	}));
}
async function setGlobalSkill(paths, name, enabled) {
	requireSafeId(name, SKILL_NAME, "skill name");
	return withGlobalMutation(paths, async () => {
		const manifest = await readGlobalManifest(paths);
		const links = { ...manifest.links };
		const recorded = globalLink(manifest, name);
		if (!enabled) {
			if (recorded === void 0) throw new Error("只能取消本插件创建的全局链接；外部全局 Skill 请使用“收纳”");
			if (await exists(recorded.target)) {
				if (!await ownsGlobalLink(recorded)) throw new Error("全局目标已被外部修改，已保留原文件；请先处理路径冲突");
				await unlink(recorded.target);
			}
			delete links[name];
			await writeGlobalManifest(paths, links);
			return {
				name,
				enabled: false
			};
		}
		const skill = (await scanSkills(paths.library)).find((entry) => entry.name === name);
		if (skill === void 0) throw new Error(`skill ${JSON.stringify(name)} is not installed in the managed library`);
		const target = skillTarget(paths.globalSkills, skill);
		const alternate = join(paths.globalSkills, skill.layout === "directory" ? `${name}.md` : name);
		if (await exists(alternate)) throw new Error(`全局目录已有同名 Skill，未覆盖：${alternate}`);
		if (recorded !== void 0 && (recorded.source !== skill.path || recorded.target !== target)) throw new Error("全局链接来源已改变，请先取消旧的全局链接");
		if (await exists(target)) {
			if (recorded !== void 0 && await ownsGlobalLink(recorded)) return {
				name,
				enabled: true
			};
			throw new Error(`全局目标已存在且不属于本插件，未覆盖：${target}`);
		}
		await mkdir(paths.globalSkills, { recursive: true });
		links[name] = {
			source: skill.path,
			target
		};
		await writeGlobalManifest(paths, links);
		await symlink(skill.path, target, skill.layout === "directory" ? process.platform === "win32" ? "junction" : "dir" : "file");
		return {
			name,
			enabled: true
		};
	});
}
async function syncWorkspace(paths, workspaceInput) {
	const workspace = await realpath(workspaceInput);
	if (!(await stat(workspace)).isDirectory()) throw new Error(`workspace is not a directory: ${workspace}`);
	const desired = await desiredSkills(paths, await readWorkspaceConfig(workspace));
	const skillsRoot = join(workspace, ".dsh", "skills");
	const manifestPath = join(workspace, ".dsh", WORKSPACE_MANIFEST_FILE);
	const manifest = await readManifest(workspace);
	const nextLinks = { ...manifest.links };
	const created = [];
	const removed = [];
	const unchanged = [];
	const missing = [];
	const conflicts = [];
	for (const [name, link] of Object.entries(manifest.links)) {
		const wanted = desired.get(name);
		if ((wanted?.skill === void 0 ? void 0 : skillTarget(skillsRoot, wanted.skill)) === link.target && wanted?.skill?.path === link.source) continue;
		if (await removeManagedLink(link)) {
			delete nextLinks[name];
			removed.push(name);
		} else conflicts.push({
			name,
			message: `managed target changed outside the plugin and was left untouched: ${link.target}`
		});
	}
	await mkdir(skillsRoot, { recursive: true });
	for (const [name, wanted] of desired) {
		if (wanted.skill === void 0) {
			missing.push(name);
			continue;
		}
		const target = skillTarget(skillsRoot, wanted.skill);
		const existing = nextLinks[name];
		if (existing?.source === wanted.skill.path && existing.target === target && await sameTarget(target, wanted.skill.path)) {
			unchanged.push(name);
			continue;
		}
		if (await exists(target)) {
			if (await sameTarget(target, wanted.skill.path)) {
				nextLinks[name] = {
					source: wanted.skill.path,
					target
				};
				unchanged.push(name);
			} else conflicts.push({
				name,
				message: `workspace already contains an unmanaged skill at ${target}`
			});
			continue;
		}
		await symlink(wanted.skill.path, target, wanted.skill.layout === "directory" ? process.platform === "win32" ? "junction" : "dir" : "file");
		nextLinks[name] = {
			source: wanted.skill.path,
			target
		};
		created.push(name);
	}
	await atomicWrite(manifestPath, `${JSON.stringify({
		version: 1,
		links: nextLinks
	}, null, 2)}\n`);
	return {
		workspace,
		created: uniqueSorted(created),
		removed: uniqueSorted(removed),
		unchanged: uniqueSorted(unchanged),
		conflicts: conflicts.sort((left, right) => left.name.localeCompare(right.name)),
		missing: uniqueSorted(missing)
	};
}
async function effectiveSkills(paths, workspaceInput) {
	const workspace = await realpath(workspaceInput);
	const desired = await desiredSkills(paths, await readWorkspaceConfig(workspace));
	const skillsRoot = join(workspace, ".dsh", "skills");
	const manifest = await readManifest(workspace);
	const rows = [];
	for (const [name, wanted] of desired) {
		if (wanted.skill === void 0) {
			rows.push({
				name,
				sources: wanted.sources,
				status: "missing",
				detail: "not installed in the managed library"
			});
			continue;
		}
		const target = skillTarget(skillsRoot, wanted.skill);
		if (await exists(target)) {
			if (await sameTarget(target, wanted.skill.path)) rows.push({
				name,
				description: wanted.skill.description,
				sources: wanted.sources,
				sourcePath: wanted.skill.path,
				targetPath: target,
				status: "linked"
			});
			else rows.push({
				name,
				sources: wanted.sources,
				sourcePath: wanted.skill.path,
				targetPath: target,
				status: "conflict",
				detail: "an unmanaged skill occupies the target path"
			});
			continue;
		}
		const recorded = manifest.links[name];
		rows.push({
			name,
			sources: wanted.sources,
			sourcePath: wanted.skill.path,
			targetPath: target,
			status: recorded === void 0 ? "pending" : "conflict",
			...recorded === void 0 ? {} : { detail: "managed link is missing; run sync to repair it" }
		});
	}
	const local = new Map([...await scanSkills(join(workspace, ".agents", "skills")), ...await scanSkills(skillsRoot)].map((skill) => [skill.name, skill]));
	for (const global of await listGlobalSkills(paths)) {
		const index = rows.findIndex((row) => row.name === global.name);
		if (index >= 0 && rows[index].status === "linked") continue;
		const project = local.get(global.name);
		const skill = project ?? global;
		const row = {
			name: skill.name,
			description: skill.description,
			sources: project === void 0 ? ["global"] : ["workspace:local"],
			sourcePath: skill.path,
			targetPath: skill.path,
			status: project === void 0 ? "global" : "linked",
			...index < 0 ? {} : { detail: `工作区托管绑定状态：${rows[index].status}；当前使用${project === void 0 ? "全局" : "本地"} Skill` }
		};
		if (index < 0) rows.push(row);
		else rows[index] = row;
	}
	return rows.sort((left, right) => left.name.localeCompare(right.name));
}
async function importSkillFromPath(paths, sourceInput, requestedName) {
	const source = await realpath(sourceInput);
	const sourceStat = await stat(source);
	const inferred = requestedName ?? (sourceStat.isFile() ? basename(source, ".md") : basename(source));
	requireSafeId(inferred, SKILL_NAME, "skill name");
	const layout = sourceStat.isDirectory() ? "directory" : "file";
	if (!sourceStat.isDirectory() && !sourceStat.isFile()) throw new Error("skill source must be a directory or Markdown file");
	if (await readSkill(source, inferred, layout) === void 0) throw new Error("skill source must contain valid name/description frontmatter and match the requested name");
	await mkdir(paths.library, { recursive: true });
	const destination = join(paths.library, layout === "directory" ? inferred : `${inferred}.md`);
	assertContained(paths.library, destination, "library destination");
	if (await exists(destination)) throw new Error(`skill ${JSON.stringify(inferred)} already exists in the managed library`);
	const temporary = `${destination}.import-${process.pid}-${Date.now()}`;
	try {
		if (layout === "directory") await cp(source, temporary, {
			recursive: true,
			dereference: true,
			errorOnExist: true
		});
		else await copyFile(source, temporary);
		await rename(temporary, destination);
	} finally {
		await rm(temporary, {
			recursive: true,
			force: true
		});
	}
	const imported = await readSkill(destination, inferred, layout);
	if (imported === void 0) throw new Error("imported skill failed validation");
	return imported;
}
async function importUploadedSkill(paths, files) {
	if (files.length === 0 || files.length > MAX_UPLOAD_FILES) throw new Error(`Skill 目录必须包含 1-${MAX_UPLOAD_FILES} 个文件`);
	await mkdir(paths.library, { recursive: true });
	const temporary = join(paths.library, `.upload-${process.pid}-${Date.now()}`);
	assertContained(paths.library, temporary, "upload temporary directory");
	let totalBytes = 0;
	try {
		await mkdir(temporary, { recursive: false });
		for (const file of files) {
			const safe = normalizeUploadPath(file.path);
			const bytes = decodeBase64(file.content);
			if (safe === void 0 || bytes === void 0) throw new Error(`Skill 目录包含无效文件：${file.path}`);
			if (bytes.length > MAX_UPLOAD_FILE_BYTES) throw new Error(`单个文件超过 4 MiB：${file.path}`);
			totalBytes += bytes.length;
			if (totalBytes > MAX_UPLOAD_TOTAL_BYTES) throw new Error("Skill 目录总大小超过 12 MiB");
			const target = join(temporary, safe);
			assertContained(temporary, target, "upload file path");
			await mkdir(dirname(target), { recursive: true });
			await writeFile(target, bytes, { flag: "wx" });
		}
		const entryContent = await readFile(join(temporary, "SKILL.md"), "utf8").catch(() => void 0);
		if (entryContent === void 0) throw new Error("选择的目录根部必须包含 SKILL.md");
		const frontmatter = parseFrontmatter(entryContent);
		const name = typeof frontmatter?.name === "string" ? frontmatter.name.trim() : "";
		const description = typeof frontmatter?.description === "string" ? frontmatter.description.trim() : "";
		requireSafeId(name, SKILL_NAME, "skill name");
		if (description.length === 0) throw new Error("SKILL.md frontmatter 必须包含 description");
		const destination = join(paths.library, name);
		assertContained(paths.library, destination, "library destination");
		if (await exists(destination) || await exists(`${destination}.md`)) throw new Error(`Skill ${JSON.stringify(name)} 已存在于托管库`);
		await rename(temporary, destination);
		const imported = await readSkill(destination, name, "directory");
		if (imported === void 0) throw new Error("导入后的 Skill 未通过格式验证");
		return imported;
	} finally {
		await rm(temporary, {
			recursive: true,
			force: true
		});
	}
}
async function adoptGlobalSkill(paths, name) {
	requireSafeId(name, SKILL_NAME, "skill name");
	return withGlobalMutation(paths, async () => {
		if (globalLink(await readGlobalManifest(paths), name) !== void 0) throw new Error("这是托管库的全局链接，请使用“取消全局”，无需重复收纳");
		const global = new Map((await scanSkills(paths.globalSkills)).map((skill) => [skill.name, skill])).get(name);
		if (global === void 0) throw new Error(`global skill ${JSON.stringify(name)} was not found`);
		const imported = await importSkillFromPath(paths, global.path, name);
		assertContained(paths.globalSkills, global.path, "global skill path");
		const sourceStat = await lstat(global.path);
		if (sourceStat.isSymbolicLink()) await unlink(global.path);
		else await rm(global.path, {
			recursive: sourceStat.isDirectory(),
			force: false
		});
		return imported;
	});
}
async function deleteLibrarySkill(paths, name) {
	requireSafeId(name, SKILL_NAME, "skill name");
	return withGlobalMutation(paths, async () => {
		const skill = new Map((await scanSkills(paths.library)).map((entry) => [entry.name, entry])).get(name);
		if (skill === void 0) throw new Error(`managed skill ${JSON.stringify(name)} was not found`);
		if (globalLink(await readGlobalManifest(paths), name) !== void 0 || (await scanSkills(paths.globalSkills)).some((global) => global.name === name && global.isSymlink && resolve(dirname(global.path), global.linkTarget ?? "") === skill.path)) throw new Error("该 Skill 仍有全局链接，请先取消全局，避免删除后产生断链");
		assertContained(paths.library, skill.path, "managed skill path");
		const entryStat = await lstat(skill.path);
		if (entryStat.isSymbolicLink()) await unlink(skill.path);
		else await rm(skill.path, {
			recursive: entryStat.isDirectory(),
			force: false
		});
	});
}
//#endregion
//#region src/index.ts
const name = "dsh-skill-collections";
const inject = [
	"webServer",
	"workspaceRegistry",
	"tools",
	"sessionSkillCatalog"
];
const API_BASE = "/dsh-skill-collections-api";
const MAX_BODY_BYTES = 16 * 1024 * 1024;
function send(res, status, body) {
	res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
	res.end(JSON.stringify(body));
}
function readBody(req) {
	return new Promise((resolveBody) => {
		let raw = "";
		let tooLarge = false;
		req.on("data", (chunk) => {
			if (tooLarge) return;
			raw += chunk.toString();
			if (Buffer.byteLength(raw) > MAX_BODY_BYTES) tooLarge = true;
		});
		req.on("end", () => {
			if (tooLarge) return resolveBody({ __error: "request body too large" });
			if (raw.length === 0) return resolveBody({});
			try {
				const parsed = JSON.parse(raw);
				resolveBody(typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? parsed : { __error: "JSON object required" });
			} catch {
				resolveBody({ __error: "malformed JSON body" });
			}
		});
	});
}
function toolDefinition(toolName, description, parameters, execute) {
	return {
		name: toolName,
		description,
		parameters,
		output: {
			schema: {},
			render: (_args, value) => [{
				type: "text",
				text: JSON.stringify(value, null, 2)
			}]
		},
		execute
	};
}
function workspaceById(ctx, id) {
	if (typeof id !== "string" || id.length === 0) throw new Error("workspaceId is required");
	const workspace = ctx.workspaceRegistry.list().find((entry) => String(entry.id) === id);
	if (workspace === void 0) throw new Error(`unknown workspace ${JSON.stringify(id)}`);
	return {
		id: String(workspace.id),
		title: workspace.title,
		path: workspace.path
	};
}
async function currentWorkspace(ctx, exec, explicit) {
	if (typeof explicit === "string" && explicit.length > 0) return workspaceById(ctx, explicit);
	const cwd = exec.agent?.session?.header?.cwd;
	if (cwd === void 0) throw new Error("workspace_id is required when the current session has no cwd");
	const canonical = await realpath(cwd);
	const workspace = ctx.workspaceRegistry.list().find((entry) => entry.path === canonical);
	if (workspace === void 0) throw new Error(`current cwd is not a registered workspace: ${canonical}`);
	return {
		id: String(workspace.id),
		title: workspace.title,
		path: workspace.path
	};
}
async function snapshot(ctx, paths, workspaceId) {
	const workspaces = ctx.workspaceRegistry.list().map((workspace) => ({
		id: String(workspace.id),
		title: workspace.title,
		path: workspace.path,
		sessionIds: Array.from(workspace.sessionIds ?? [], String)
	}));
	const value = {
		paths,
		library: await scanSkills(paths.library),
		globalSkills: await listGlobalSkills(paths),
		collections: await readCollections(paths),
		workspaces
	};
	if (typeof workspaceId === "string" && workspaceId.length > 0) {
		const workspace = workspaceById(ctx, workspaceId);
		value.workspace = {
			...workspace,
			config: await readWorkspaceConfig(workspace.path),
			effective: await effectiveSkills(paths, workspace.path)
		};
	}
	return value;
}
async function resyncUsers(ctx, paths, collectionId, skillName) {
	const collections = skillName === void 0 ? [] : await readCollections(paths);
	for (const workspace of ctx.workspaceRegistry.list()) {
		const config = await readWorkspaceConfig(workspace.path);
		if (collectionId !== void 0 && !config.collections.includes(collectionId)) continue;
		if (skillName !== void 0) {
			if (!collections.some((collection) => config.collections.includes(collection.id) && collection.skills.includes(skillName)) && !config.skills.enabled.includes(skillName)) continue;
		}
		await syncWorkspace(paths, workspace.path);
	}
}
async function handleEndpoint(ctx, paths, endpoint, body) {
	if (endpoint === "snapshot") return snapshot(ctx, paths, body.workspaceId);
	if (endpoint === "global-skill") {
		if (typeof body.enabled !== "boolean") throw new Error("enabled must be a boolean");
		return setGlobalSkill(paths, typeof body.name === "string" ? body.name : "", body.enabled);
	}
	if (endpoint === "collection-save") {
		const id = typeof body.id === "string" ? body.id : "";
		const collection = await saveCollection(paths, {
			id,
			name: typeof body.name === "string" ? body.name : "",
			description: typeof body.description === "string" ? body.description : "",
			skills: Array.isArray(body.skills) ? body.skills.filter((entry) => typeof entry === "string") : []
		});
		await resyncUsers(ctx, paths, id);
		return collection;
	}
	if (endpoint === "collection-delete") {
		const id = typeof body.id === "string" ? body.id : "";
		const users = [];
		for (const workspace of ctx.workspaceRegistry.list()) if ((await readWorkspaceConfig(workspace.path)).collections.includes(id)) users.push(workspace);
		if (users.length > 0 && body.force !== true) throw new Error(`collection is enabled in ${users.length} workspace(s); confirm force deletion`);
		for (const workspace of users) await updateWorkspaceCollection(workspace.path, id, false);
		await removeCollection(paths, id);
		for (const workspace of users) await syncWorkspace(paths, workspace.path);
		return {
			id,
			removedFrom: users.map((workspace) => String(workspace.id))
		};
	}
	if (endpoint === "workspace-collection") {
		const workspace = workspaceById(ctx, body.workspaceId);
		const id = typeof body.id === "string" ? body.id : "";
		if (body.enabled === true && !(await readCollections(paths)).some((collection) => collection.id === id)) throw new Error(`unknown collection ${JSON.stringify(id)}`);
		await updateWorkspaceCollection(workspace.path, id, body.enabled === true);
		return {
			config: await readWorkspaceConfig(workspace.path),
			sync: await syncWorkspace(paths, workspace.path)
		};
	}
	if (endpoint === "workspace-skill") {
		const workspace = workspaceById(ctx, body.workspaceId);
		const skill = typeof body.skill === "string" ? body.skill : "";
		const mode = body.mode === "enable" || body.mode === "disable" || body.mode === "clear" ? body.mode : void 0;
		if (mode === void 0) throw new Error("mode must be enable, disable, or clear");
		if (mode === "enable" && !(await scanSkills(paths.library)).some((entry) => entry.name === skill)) throw new Error(`skill ${JSON.stringify(skill)} is not installed in the managed library`);
		await updateWorkspaceSkill(workspace.path, skill, mode);
		return {
			config: await readWorkspaceConfig(workspace.path),
			sync: await syncWorkspace(paths, workspace.path)
		};
	}
	if (endpoint === "workspace-sync") return syncWorkspace(paths, workspaceById(ctx, body.workspaceId).path);
	if (endpoint === "library-adopt-global") {
		const skill = await adoptGlobalSkill(paths, typeof body.name === "string" ? body.name : "");
		await resyncUsers(ctx, paths, void 0, skill.name);
		return { skill };
	}
	if (endpoint === "library-import-path") {
		const skill = await importSkillFromPath(paths, typeof body.path === "string" ? body.path : "", typeof body.name === "string" ? body.name : void 0);
		await resyncUsers(ctx, paths, void 0, skill.name);
		return { skill };
	}
	if (endpoint === "library-upload") {
		if (!Array.isArray(body.files)) throw new Error("files array is required");
		const skill = await importUploadedSkill(paths, body.files.map((entry) => {
			if (typeof entry !== "object" || entry === null || Array.isArray(entry)) throw new Error("invalid uploaded file");
			const record = entry;
			if (typeof record.path !== "string" || typeof record.content !== "string") throw new Error("invalid uploaded file");
			return {
				path: record.path,
				content: record.content
			};
		}));
		await resyncUsers(ctx, paths, void 0, skill.name);
		return { skill };
	}
	if (endpoint === "library-delete") {
		const skill = typeof body.name === "string" ? body.name : "";
		const assigned = [];
		for (const workspace of ctx.workspaceRegistry.list()) if ((await effectiveSkills(paths, workspace.path)).some((entry) => entry.name === skill)) assigned.push(workspace);
		const collectionUsers = (await readCollections(paths)).filter((collection) => collection.skills.includes(skill));
		if ((assigned.length > 0 || collectionUsers.length > 0) && body.force !== true) throw new Error(`skill is referenced by ${collectionUsers.length} collection(s) and ${assigned.length} workspace(s); confirm force deletion`);
		await deleteLibrarySkill(paths, skill);
		await resyncUsers(ctx, paths, void 0, skill);
		return {
			skill,
			collections: collectionUsers.map((collection) => collection.id),
			workspaces: assigned.map((workspace) => String(workspace.id))
		};
	}
	throw new Error(`unknown endpoint ${endpoint}`);
}
function registerTools(ctx, paths) {
	ctx.tools.register(toolDefinition("skill_collection_list", "List Skill management state and the current session’s complete native / catalog. workspace.effective is binding diagnostics, not the full available catalog.", {
		type: "object",
		properties: { workspace_id: {
			type: "string",
			description: "Optional registered workspace id. Omit to use the current session workspace."
		} },
		additionalProperties: false
	}, async (args, exec) => {
		exec.signal.throwIfAborted();
		let id = typeof args.workspace_id === "string" && args.workspace_id.length > 0 ? args.workspace_id : void 0;
		if (id === void 0 && exec.agent?.session?.header?.cwd !== void 0) {
			const cwd = await realpath(exec.agent.session.header.cwd);
			id = ctx.workspaceRegistry.list().find((workspace) => workspace.path === cwd)?.id;
		}
		const value = await snapshot(ctx, paths, id);
		exec.signal.throwIfAborted();
		if (exec.agent?.id !== void 0) {
			const catalog = await ctx.sessionSkillCatalog.list({ sessionId: exec.agent.id }, exec.signal);
			exec.signal.throwIfAborted();
			value.currentSessionCatalog = {
				sessionId: exec.agent.id,
				skills: catalog.skills
			};
		}
		return value;
	}));
	ctx.tools.register(toolDefinition("skill_collection_manage", "Manage Skill collections and workspace bindings, import Skills, enable/disable managed Skills globally, or adopt external global Skills into the library (removes the global original). Disabling global only removes this plugin’s link; library content is preserved.", {
		type: "object",
		properties: {
			action: {
				type: "string",
				enum: [
					"save_collection",
					"delete_collection",
					"enable_collection",
					"disable_collection",
					"enable_skill",
					"disable_skill",
					"clear_skill",
					"sync",
					"import_path",
					"adopt_global",
					"enable_global",
					"disable_global"
				]
			},
			workspace_id: {
				type: "string",
				description: "Registered workspace id; omit to use the current session workspace."
			},
			collection_id: { type: "string" },
			name: {
				type: "string",
				description: "Collection display name, Skill name, or optional imported Skill name depending on action."
			},
			description: { type: "string" },
			skills: {
				type: "array",
				items: { type: "string" }
			},
			source_path: {
				type: "string",
				description: "Absolute local Skill directory or flat Markdown path for import_path."
			},
			force: { type: "boolean" }
		},
		required: ["action"],
		additionalProperties: false
	}, async (args, exec) => {
		const action = args.action;
		if (action === "save_collection") return handleEndpoint(ctx, paths, "collection-save", {
			id: args.collection_id,
			name: args.name,
			description: args.description,
			skills: args.skills
		});
		if (action === "delete_collection") return handleEndpoint(ctx, paths, "collection-delete", {
			id: args.collection_id,
			force: args.force
		});
		if (action === "import_path") return handleEndpoint(ctx, paths, "library-import-path", {
			path: args.source_path,
			name: args.name
		});
		if (action === "adopt_global") return handleEndpoint(ctx, paths, "library-adopt-global", { name: args.name });
		if (action === "enable_global" || action === "disable_global") return handleEndpoint(ctx, paths, "global-skill", {
			name: args.name,
			enabled: action === "enable_global"
		});
		const workspace = await currentWorkspace(ctx, exec, args.workspace_id);
		if (action === "enable_collection" || action === "disable_collection") return handleEndpoint(ctx, paths, "workspace-collection", {
			workspaceId: workspace.id,
			id: args.collection_id,
			enabled: action === "enable_collection"
		});
		if (action === "enable_skill" || action === "disable_skill" || action === "clear_skill") return handleEndpoint(ctx, paths, "workspace-skill", {
			workspaceId: workspace.id,
			skill: args.name,
			mode: action.replace("_skill", "")
		});
		if (action === "sync") return handleEndpoint(ctx, paths, "workspace-sync", { workspaceId: workspace.id });
		throw new Error(`unsupported action ${String(action)}`);
	}));
}
function apply(ctx, config = {}) {
	const paths = resolvePaths(config.dshHome);
	ctx.effect(() => ctx.webServer.register({
		kind: "prefix",
		path: API_BASE,
		handler: async (req, res) => {
			if (req.method !== "POST") return send(res, 405, {
				ok: false,
				error: { message: "POST required" }
			});
			const body = await readBody(req);
			if (typeof body.__error === "string") return send(res, 400, {
				ok: false,
				error: { message: body.__error }
			});
			const endpoint = (req.url ?? "").split("?")[0].split("/").filter(Boolean).at(-1) ?? "";
			try {
				send(res, 200, {
					ok: true,
					value: await handleEndpoint(ctx, paths, endpoint, body)
				});
			} catch (error) {
				send(res, 400, {
					ok: false,
					error: { message: error instanceof Error ? error.message : String(error) }
				});
			}
		}
	}), "dsh-skill-collections: api routes");
	registerTools(ctx, paths);
	ctx.logger.info(`Skill collections ready: library=${paths.library}`);
}
const _internals = {
	handleEndpoint,
	snapshot
};
//#endregion
export { _internals, apply, inject, name };

//# sourceMappingURL=index.js.map