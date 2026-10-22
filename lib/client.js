window.__ModuleLoader__.load({
	id: "@dsh-external/dsh-skill-collections",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/confirmation.ts
		/** One cancellable request at a time; dismissal/unmount never authorizes an action. */
		var ConfirmationController = class {
			changed;
			active = false;
			resolve;
			constructor(changed) {
				this.changed = changed;
			}
			activate() {
				this.active = true;
			}
			request(options) {
				if (!this.active || this.resolve !== void 0) return Promise.resolve(false);
				return new Promise((resolve) => {
					this.resolve = resolve;
					this.changed(options);
				});
			}
			answer(accepted) {
				const resolve = this.resolve;
				if (resolve === void 0) return;
				this.resolve = void 0;
				this.changed(null);
				resolve(accepted);
			}
			dispose() {
				this.active = false;
				const resolve = this.resolve;
				this.resolve = void 0;
				resolve?.(false);
			}
		};
		//#endregion
		//#region \0dsh-css:/home/ccm/deepseek-tool/dsh-skill-collections/src/client/./skill-collections.module.css.mjs
		const css = ".kBwD2W_root{color:var(--dsw-alias-label-primary);font:var(--dsw-font-s-14);flex-direction:column;gap:16px;display:flex}.kBwD2W_header{justify-content:space-between;align-items:flex-start;gap:16px;display:flex}.kBwD2W_header h2,.kBwD2W_section h3{color:var(--dsw-alias-label-primary);margin:0}.kBwD2W_header h2{font:var(--dsw-font-l-20)}.kBwD2W_section h3{font:var(--dsw-font-base-strong-16)}.kBwD2W_header p,.kBwD2W_sectionHeader p,.kBwD2W_sectionHeaderSecondary p{color:var(--dsw-alias-label-secondary);font:var(--dsw-font-xs-13);margin:5px 0 0}.kBwD2W_tabs{border-bottom:1px solid var(--dsw-alias-border-l2);gap:8px;display:flex}.kBwD2W_tab,.kBwD2W_tabActive{color:var(--dsw-alias-label-secondary);font:var(--dsw-font-s-strong-14);cursor:pointer;background:0 0;border:0;border-bottom:2px solid #0000;padding:10px 14px}.kBwD2W_tab:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}.kBwD2W_tabActive{border-bottom-color:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-state-business-primary)}.kBwD2W_section{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);border-radius:10px;padding:16px}.kBwD2W_sectionHeader,.kBwD2W_sectionHeaderSecondary{justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:12px;display:flex}.kBwD2W_sectionHeaderSecondary{border-top:1px solid var(--dsw-alias-border-l2);margin-top:24px;padding-top:20px}.kBwD2W_badge,.kBwD2W_badgeMuted{text-align:center;background:var(--dsw-alias-state-business-tertiary);min-width:28px;color:var(--dsw-alias-state-business-primary);font:var(--dsw-font-xxs-strong-12);border-radius:999px;padding:4px 9px}.kBwD2W_badgeMuted{background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary)}.kBwD2W_libraryLocation{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-module-platform);border-radius:8px;justify-content:space-between;align-items:center;gap:16px;margin-bottom:14px;padding:12px;display:flex}.kBwD2W_libraryLocation>div{flex-direction:column;gap:4px;min-width:0;display:flex}.kBwD2W_libraryLocation strong{color:var(--dsw-alias-label-primary);font:var(--dsw-font-xs-strong-13)}.kBwD2W_libraryLocation code{color:var(--dsw-alias-label-tertiary);font:var(--dsw-font-markdown-code-block-small);overflow-wrap:anywhere}.kBwD2W_hiddenInput{display:none}.kBwD2W_listToolbar{align-items:center;gap:10px;margin:4px 0 10px;display:flex}.kBwD2W_listSearch{flex:1;min-width:0}.kBwD2W_resultCount{color:var(--dsw-alias-label-tertiary);font:var(--dsw-font-xxs-12);white-space:nowrap;flex:none}.kBwD2W_filterSelect{flex:none;width:112px}.kBwD2W_list{flex-direction:column;gap:8px;display:flex}.kBwD2W_skillRow{border-bottom:1px solid var(--dsw-alias-border-l1);align-items:center;gap:8px;min-height:42px;padding:4px 6px 4px 10px;display:flex}.kBwD2W_skillRow:last-child{border-bottom:0}.kBwD2W_skillRow:hover{background:var(--dsw-alias-interactive-bg-hover);border-radius:7px}.kBwD2W_skillSummary{min-width:0;color:inherit;text-align:left;cursor:pointer;background:0 0;border:0;flex:1;grid-template-columns:minmax(120px,180px) auto minmax(0,1fr);align-items:center;gap:10px;padding:6px 0;display:grid}.kBwD2W_skillSummary strong{color:var(--dsw-alias-label-primary);font:var(--dsw-font-s-strong-14);text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.kBwD2W_skillScope{background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-tertiary);font:var(--dsw-font-xxxs-11);white-space:nowrap;border-radius:999px;padding:2px 7px}.kBwD2W_skillDescription{min-width:0;color:var(--dsw-alias-label-secondary);font:var(--dsw-font-xs-13);text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.kBwD2W_row{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-module-platform);border-radius:8px;justify-content:space-between;align-items:center;gap:12px;padding:12px;display:flex}.kBwD2W_row:hover{border-color:var(--dsw-alias-border-l2)}.kBwD2W_rowMain{flex:1;min-width:0}.kBwD2W_rowTitle{color:var(--dsw-alias-label-primary);font:var(--dsw-font-s-strong-14);overflow-wrap:anywhere}.kBwD2W_rowDescription{color:var(--dsw-alias-label-secondary);font:var(--dsw-font-xs-13);margin-top:4px}.kBwD2W_path{color:var(--dsw-alias-label-tertiary);font:var(--dsw-font-markdown-code-block-small);overflow-wrap:anywhere;margin-top:5px}.kBwD2W_rowActions{flex-wrap:wrap;flex:none;align-items:center;gap:6px;display:flex}.kBwD2W_dangerLink,.kBwD2W_dangerButton{color:var(--dsw-alias-state-error-primary)!important}.kBwD2W_dangerLink:hover,.kBwD2W_dangerButton:hover{background:var(--dsw-alias-interactive-bg-hover-danger)!important}.kBwD2W_root input:not([type=checkbox]):not([type=file]),.kBwD2W_root textarea,.kBwD2W_root select{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);box-sizing:border-box;font:var(--dsw-font-s-14);border-radius:7px;outline:none;padding:8px 10px}.kBwD2W_root input:focus,.kBwD2W_root textarea:focus,.kBwD2W_root select:focus{border-color:var(--dsw-alias-state-business-primary)}.kBwD2W_root input::placeholder,.kBwD2W_root textarea::placeholder{color:var(--dsw-alias-label-tertiary)}.kBwD2W_root input:disabled,.kBwD2W_root textarea:disabled,.kBwD2W_root select:disabled{color:var(--dsw-alias-label-dimmed);background:var(--dsw-alias-bg-module-platform)}.kBwD2W_empty{text-align:center;color:var(--dsw-alias-label-secondary);border:1px dashed var(--dsw-alias-border-l2);border-radius:8px;padding:24px}.kBwD2W_error,.kBwD2W_notice{font:var(--dsw-font-xs-13);border-radius:8px;padding:10px 12px}.kBwD2W_error{background:var(--dsw-alias-interactive-bg-hover-danger);color:var(--dsw-alias-state-error-primary);border:1px solid var(--dsw-alias-state-error-secondary)}.kBwD2W_notice{background:var(--dsw-alias-state-success-tertiary);color:var(--dsw-alias-state-success-primary);border:1px solid var(--dsw-alias-state-success-secondary)}.kBwD2W_collectionRows{flex-direction:column;display:flex}.kBwD2W_collectionRow{border:0;border-bottom:1px solid var(--dsw-alias-border-l1);min-height:48px;color:var(--dsw-alias-label-primary);text-align:left;cursor:pointer;background:0 0;grid-template-columns:minmax(140px,220px) minmax(0,1fr) auto;align-items:center;gap:12px;padding:8px 10px;display:grid}.kBwD2W_collectionRow:last-child{border-bottom:0}.kBwD2W_collectionRow:hover{background:var(--dsw-alias-interactive-bg-hover);border-radius:7px}.kBwD2W_collectionRow strong{font:var(--dsw-font-s-strong-14);text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.kBwD2W_collectionDescription{min-width:0;color:var(--dsw-alias-label-secondary);font:var(--dsw-font-xs-13);text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.kBwD2W_collectionCount{color:var(--dsw-alias-state-business-primary);font:var(--dsw-font-xxs-strong-12);white-space:nowrap}.kBwD2W_toggleList{flex-direction:column;gap:6px;display:flex}.kBwD2W_checkRow,.kBwD2W_toggleRow{background:var(--dsw-alias-bg-module-platform);border-radius:6px;align-items:flex-start;gap:9px;padding:8px;display:flex}.kBwD2W_checkRow:hover,.kBwD2W_toggleRow:hover{background:var(--dsw-alias-interactive-bg-hover)}.kBwD2W_checkRow span,.kBwD2W_toggleRow span,.kBwD2W_overrideRow span{flex-direction:column;gap:3px;display:flex}.kBwD2W_checkRow small,.kBwD2W_toggleRow small,.kBwD2W_overrideRow small{color:var(--dsw-alias-label-tertiary);font:var(--dsw-font-xxxs-11)}.kBwD2W_workspaceToolbar{justify-content:space-between;align-items:flex-end;gap:8px;margin-bottom:14px;display:flex}.kBwD2W_workspaceToolbar label{color:var(--dsw-alias-label-secondary);flex-direction:column;flex:1;gap:6px;display:flex}.kBwD2W_workspaceColumns{grid-template-columns:1fr 1fr;gap:16px;display:grid}.kBwD2W_overrideRow{background:var(--dsw-alias-bg-module-platform);border-radius:6px;justify-content:space-between;align-items:center;gap:8px;padding:8px;display:flex}.kBwD2W_overrideRow:hover{background:var(--dsw-alias-interactive-bg-hover)}.kBwD2W_status{font:var(--dsw-font-xxxs-strong-11);text-transform:uppercase;vertical-align:1px;border-radius:999px;padding:2px 7px;display:inline-flex}.kBwD2W_status_linked{background:var(--dsw-alias-state-success-tertiary);color:var(--dsw-alias-state-success-primary)}.kBwD2W_status_global{background:var(--dsw-alias-state-business-tertiary);color:var(--dsw-alias-state-business-primary)}.kBwD2W_status_pending{background:var(--dsw-alias-state-warn-tertiary);color:var(--dsw-alias-state-warn-label)}.kBwD2W_status_conflict,.kBwD2W_status_missing{background:var(--dsw-alias-interactive-bg-hover-danger);color:var(--dsw-alias-state-error-primary)}.kBwD2W_warning{color:var(--dsw-alias-state-error-primary);font:var(--dsw-font-xxs-12);margin-top:5px}.kBwD2W_detailModal{width:min(560px,100%)}.kBwD2W_confirmationModal{width:min(440px,100vw - 32px)}.kBwD2W_confirmationMessage{color:var(--dsw-alias-label-secondary);font:var(--dsw-font-s-14);overflow-wrap:anywhere;margin:0;line-height:1.7}.kBwD2W_availableSkills{border-bottom:1px solid var(--dsw-alias-border-l2);margin:16px 0 24px;padding-bottom:20px}.kBwD2W_catalogSession{min-width:0;color:var(--dsw-alias-label-secondary);font:var(--dsw-font-xs-13);flex:1;align-items:center;gap:10px;display:flex}.kBwD2W_catalogSession select{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);min-width:0;color:var(--dsw-alias-label-primary);font:inherit;border-radius:7px;flex:1;padding:7px 10px}.kBwD2W_catalogRefresh{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:var(--dsw-font-xs-13);cursor:pointer;border-radius:7px;flex:none;padding:7px 12px}.kBwD2W_catalogRefresh:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}.kBwD2W_catalogRefresh:disabled{opacity:.5;cursor:default}.kBwD2W_catalogRefresh:focus-visible,.kBwD2W_catalogSession select:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}.kBwD2W_catalogList{max-height:min(55vh,560px);overflow-y:auto}.kBwD2W_catalogList .kBwD2W_rowDescription{white-space:normal;overflow-wrap:anywhere}.kBwD2W_bindingDiagnostics{margin-top:20px}.kBwD2W_bindingDiagnostics>summary{cursor:pointer;color:var(--dsw-alias-label-secondary);font:var(--dsw-font-xs-13)}.kBwD2W_detailList{flex-direction:column;gap:14px;margin:0;display:flex}.kBwD2W_detailList>div{grid-template-columns:86px minmax(0,1fr);gap:12px;display:grid}.kBwD2W_detailList dt{color:var(--dsw-alias-label-tertiary);font:var(--dsw-font-xs-13)}.kBwD2W_detailList dd{min-width:0;color:var(--dsw-alias-label-primary);font:var(--dsw-font-s-14);overflow-wrap:anywhere;margin:0}.kBwD2W_detailList code{color:var(--dsw-alias-label-secondary);font:var(--dsw-font-markdown-code-block-small)}.kBwD2W_collectionModal{width:min(720px,100%)}.kBwD2W_collectionModalContent{max-height:calc(100vh - 120px);overflow-y:auto}.kBwD2W_modalForm{flex-direction:column;gap:14px;display:flex}.kBwD2W_modalForm>label{color:var(--dsw-alias-label-secondary);font:var(--dsw-font-xs-13);flex-direction:column;gap:6px;display:flex}.kBwD2W_modalForm input:not([type=checkbox]),.kBwD2W_modalForm textarea{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);width:100%;color:var(--dsw-alias-label-primary);font:var(--dsw-font-s-14);border-radius:7px;outline:none;padding:8px 10px}.kBwD2W_modalForm input:focus,.kBwD2W_modalForm textarea:focus{border-color:var(--dsw-alias-state-business-primary)}.kBwD2W_modalForm input:disabled{background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-dimmed)}.kBwD2W_skillPickerHeader{justify-content:space-between;align-items:center;gap:12px;margin-top:4px;display:flex}.kBwD2W_skillPickerHeader>div{flex-direction:column;gap:2px;display:flex}.kBwD2W_skillPickerHeader strong{color:var(--dsw-alias-label-primary);font:var(--dsw-font-s-strong-14)}.kBwD2W_skillPickerHeader span{color:var(--dsw-alias-label-tertiary);font:var(--dsw-font-xxs-12)}.kBwD2W_skillSearch{width:min(260px,50%)}.kBwD2W_modalSkillList{border:1px solid var(--dsw-alias-border-l1);border-radius:8px;flex-direction:column;display:flex}.kBwD2W_modalSkillRow{border-bottom:1px solid var(--dsw-alias-border-l1);cursor:pointer;grid-template-columns:auto minmax(120px,190px) minmax(0,1fr);align-items:center;gap:10px;min-height:42px;padding:6px 10px;display:grid}.kBwD2W_modalSkillRow:last-child{border-bottom:0}.kBwD2W_modalSkillRow:hover{background:var(--dsw-alias-interactive-bg-hover)}.kBwD2W_modalSkillRow strong{color:var(--dsw-alias-label-primary);font:var(--dsw-font-xs-strong-13);text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.kBwD2W_modalSkillRow span{min-width:0;color:var(--dsw-alias-label-secondary);font:var(--dsw-font-xxs-12);text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.kBwD2W_emptyCompact{text-align:center;color:var(--dsw-alias-label-tertiary);font:var(--dsw-font-xs-13);padding:18px}.kBwD2W_modalDelete{margin-right:auto;color:var(--dsw-alias-state-error-primary)!important}.kBwD2W_modalDelete:hover{background:var(--dsw-alias-interactive-bg-hover-danger)!important}.kBwD2W_quickPicker{flex:none;align-items:center;display:inline-flex;position:relative}.kBwD2W_quickButton{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-module-platform);width:31px;height:28px;color:var(--dsw-alias-label-secondary);cursor:pointer;border-radius:8px;justify-content:center;align-items:center;gap:1px;padding:0 3px 0 5px;transition:color .16s,border-color .16s,background .16s;display:inline-flex}.kBwD2W_quickButton:hover,.kBwD2W_quickButtonActive{border-color:var(--dsw-alias-state-business-primary);background:var(--dsw-alias-state-business-tertiary);color:var(--dsw-alias-state-business-primary)}.kBwD2W_quickChevron{opacity:.72}.kBwD2W_quickPopover{z-index:10020;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);width:min(360px,100vw - 24px);max-height:min(500px,100vh - 120px);color:var(--dsw-alias-label-primary);border-radius:12px;flex-direction:column;display:flex;position:absolute;bottom:calc(100% + 9px);right:0;overflow:hidden;box-shadow:0 16px 44px #02061457}.kBwD2W_quickHeader{border-bottom:1px solid var(--dsw-alias-border-l1);justify-content:space-between;align-items:center;gap:8px;padding:10px 12px 8px;display:flex}.kBwD2W_quickTitle{min-width:0;font:var(--dsw-font-xs-strong-13);align-items:center;gap:6px;display:flex}.kBwD2W_quickTitle strong{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.kBwD2W_quickTitle span{background:var(--dsw-alias-state-business-tertiary);color:var(--dsw-alias-state-business-primary);font:var(--dsw-font-xxxs-strong-11);border-radius:999px;flex:none;padding:2px 7px}.kBwD2W_quickIconButton{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-module-platform);width:25px;height:25px;color:var(--dsw-alias-label-secondary);cursor:pointer;border-radius:7px;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.kBwD2W_quickIconButton:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}.kBwD2W_quickSearchRow{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-tertiary);border-radius:8px;align-items:center;gap:7px;margin:9px 10px 7px;padding:0 9px;display:flex}.kBwD2W_quickSearch{width:100%;min-width:0;color:var(--dsw-alias-label-primary);font:var(--dsw-font-s-14);background:0 0;border:0;outline:none;padding:8px 0}.kBwD2W_quickSearch::placeholder{color:var(--dsw-alias-label-tertiary)}.kBwD2W_quickList{min-height:0;padding:0 6px 6px;overflow-y:auto}.kBwD2W_quickSectionLabel{color:var(--dsw-alias-label-tertiary);font:var(--dsw-font-xxs-strong-12);padding:4px 7px 5px}.kBwD2W_quickItem{width:100%;min-height:50px;color:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:8px;flex-direction:column;gap:3px;padding:8px 9px;display:flex}.kBwD2W_quickItem:hover,.kBwD2W_quickItemActive{background:var(--dsw-alias-interactive-bg-hover)}.kBwD2W_quickItemName{color:var(--dsw-alias-label-primary);font:var(--dsw-font-s-strong-14);text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.kBwD2W_quickItemDescription{color:var(--dsw-alias-label-secondary);font:var(--dsw-font-xs-13);text-overflow:ellipsis;white-space:nowrap;line-height:18px;overflow:hidden}.kBwD2W_quickStatus,.kBwD2W_quickStatusError{color:var(--dsw-alias-label-secondary);font:var(--dsw-font-xs-13);text-align:center;padding:22px 14px}.kBwD2W_quickStatusError{color:var(--dsw-alias-state-error-primary)}.kBwD2W_quickFooter{border-top:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-tertiary);font:var(--dsw-font-xxs-12);padding:7px 11px 9px}.kBwD2W_quickFooter code{color:var(--dsw-alias-label-secondary);font:var(--dsw-font-markdown-code-block-small)}.kBwD2W_section>.kBwD2W_list{gap:4px;max-height:560px;padding-right:3px;overflow-y:auto}.kBwD2W_skillRow{min-height:52px;padding:7px 8px 7px 12px}.kBwD2W_skillSummary{grid-template-columns:minmax(140px,210px) auto minmax(0,1fr);gap:12px}.kBwD2W_skillDescription{white-space:normal;-webkit-line-clamp:2;-webkit-box-orient:vertical;line-height:18px;display:-webkit-box}.kBwD2W_collectionRows{max-height:560px;padding-right:3px;overflow-y:auto}.kBwD2W_collectionRow{min-height:58px;padding:10px 12px}.kBwD2W_managementButton{color:var(--dsw-alias-label-secondary)}.kBwD2W_managementButton:hover:not(:disabled){color:var(--dsw-alias-label-primary)}.kBwD2W_managementButton:disabled{cursor:not-allowed;opacity:.48}.kBwD2W_managementModal{width:min(960px,100vw - 32px)}.kBwD2W_managementModalContent{max-height:calc(100vh - 120px);overflow-y:auto}@media (width<=850px){.kBwD2W_workspaceColumns{grid-template-columns:1fr}.kBwD2W_workspaceToolbar,.kBwD2W_libraryLocation{flex-direction:column;align-items:stretch}.kBwD2W_skillSummary{grid-template-columns:minmax(100px,150px) auto minmax(0,1fr)}.kBwD2W_collectionRow{grid-template-columns:minmax(120px,1fr) auto}.kBwD2W_collectionDescription{display:none}.kBwD2W_skillPickerHeader{flex-direction:column;align-items:stretch}.kBwD2W_skillSearch{width:100%}.kBwD2W_modalSkillRow{grid-template-columns:auto minmax(0,1fr)}.kBwD2W_modalSkillRow span{display:none}.kBwD2W_listToolbar{flex-wrap:wrap;align-items:stretch}.kBwD2W_listSearch{flex-basis:100%}.kBwD2W_filterSelect{flex:1;width:auto}.kBwD2W_resultCount{margin-left:auto}}";
		const tagId = "@dsh-external/dsh-skill-collections/skill-collections.module.css";
		function installStyles() {
			if (typeof document === "undefined") return () => {};
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-external/dsh-skill-collections";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
			return () => tag.remove();
		}
		var skill_collections_module_css_default = {
			"collectionCount": "kBwD2W_collectionCount",
			"emptyCompact": "kBwD2W_emptyCompact",
			"list": "kBwD2W_list",
			"skillDescription": "kBwD2W_skillDescription",
			"tabs": "kBwD2W_tabs",
			"rowTitle": "kBwD2W_rowTitle",
			"detailModal": "kBwD2W_detailModal",
			"toggleRow": "kBwD2W_toggleRow",
			"listToolbar": "kBwD2W_listToolbar",
			"catalogList": "kBwD2W_catalogList",
			"modalForm": "kBwD2W_modalForm",
			"empty": "kBwD2W_empty",
			"filterSelect": "kBwD2W_filterSelect",
			"toggleList": "kBwD2W_toggleList",
			"overrideRow": "kBwD2W_overrideRow",
			"status_missing": "kBwD2W_status_missing",
			"confirmationModal": "kBwD2W_confirmationModal",
			"bindingDiagnostics": "kBwD2W_bindingDiagnostics",
			"quickStatusError": "kBwD2W_quickStatusError",
			"managementButton": "kBwD2W_managementButton",
			"resultCount": "kBwD2W_resultCount",
			"skillPickerHeader": "kBwD2W_skillPickerHeader",
			"status_conflict": "kBwD2W_status_conflict",
			"listSearch": "kBwD2W_listSearch",
			"collectionRows": "kBwD2W_collectionRows",
			"catalogRefresh": "kBwD2W_catalogRefresh",
			"quickTitle": "kBwD2W_quickTitle",
			"skillSummary": "kBwD2W_skillSummary",
			"collectionDescription": "kBwD2W_collectionDescription",
			"rowActions": "kBwD2W_rowActions",
			"workspaceColumns": "kBwD2W_workspaceColumns",
			"status_linked": "kBwD2W_status_linked",
			"sectionHeaderSecondary": "kBwD2W_sectionHeaderSecondary",
			"sectionHeader": "kBwD2W_sectionHeader",
			"error": "kBwD2W_error",
			"row": "kBwD2W_row",
			"path": "kBwD2W_path",
			"quickButton": "kBwD2W_quickButton",
			"quickItemDescription": "kBwD2W_quickItemDescription",
			"checkRow": "kBwD2W_checkRow",
			"tabActive": "kBwD2W_tabActive",
			"tab": "kBwD2W_tab",
			"modalDelete": "kBwD2W_modalDelete",
			"availableSkills": "kBwD2W_availableSkills",
			"quickStatus": "kBwD2W_quickStatus",
			"badgeMuted": "kBwD2W_badgeMuted",
			"quickItemActive": "kBwD2W_quickItemActive",
			"quickHeader": "kBwD2W_quickHeader",
			"skillRow": "kBwD2W_skillRow",
			"quickChevron": "kBwD2W_quickChevron",
			"quickFooter": "kBwD2W_quickFooter",
			"collectionModalContent": "kBwD2W_collectionModalContent",
			"quickIconButton": "kBwD2W_quickIconButton",
			"badge": "kBwD2W_badge",
			"quickPicker": "kBwD2W_quickPicker",
			"quickItemName": "kBwD2W_quickItemName",
			"section": "kBwD2W_section",
			"dangerLink": "kBwD2W_dangerLink",
			"workspaceToolbar": "kBwD2W_workspaceToolbar",
			"managementModalContent": "kBwD2W_managementModalContent",
			"quickSearchRow": "kBwD2W_quickSearchRow",
			"warning": "kBwD2W_warning",
			"quickSearch": "kBwD2W_quickSearch",
			"header": "kBwD2W_header",
			"hiddenInput": "kBwD2W_hiddenInput",
			"detailList": "kBwD2W_detailList",
			"dangerButton": "kBwD2W_dangerButton",
			"collectionRow": "kBwD2W_collectionRow",
			"libraryLocation": "kBwD2W_libraryLocation",
			"status_global": "kBwD2W_status_global",
			"status_pending": "kBwD2W_status_pending",
			"skillSearch": "kBwD2W_skillSearch",
			"root": "kBwD2W_root",
			"notice": "kBwD2W_notice",
			"modalSkillRow": "kBwD2W_modalSkillRow",
			"managementModal": "kBwD2W_managementModal",
			"quickList": "kBwD2W_quickList",
			"status": "kBwD2W_status",
			"modalSkillList": "kBwD2W_modalSkillList",
			"skillScope": "kBwD2W_skillScope",
			"quickPopover": "kBwD2W_quickPopover",
			"quickItem": "kBwD2W_quickItem",
			"confirmationMessage": "kBwD2W_confirmationMessage",
			"rowMain": "kBwD2W_rowMain",
			"quickSectionLabel": "kBwD2W_quickSectionLabel",
			"catalogSession": "kBwD2W_catalogSession",
			"collectionModal": "kBwD2W_collectionModal",
			"quickButtonActive": "kBwD2W_quickButtonActive",
			"rowDescription": "kBwD2W_rowDescription"
		};
		//#endregion
		//#region src/client/AvailableSkills.tsx
		/** Read-only view of the same session-addressed catalog as the native / menu. */
		function AvailableSkills({ sessionIds, preferredSessionId, query, refreshKey }) {
			const ids = [...new Set([...preferredSessionId === void 0 ? [] : [preferredSessionId], ...sessionIds])];
			const [selected, setSelected] = (0, react.useState)(preferredSessionId);
			const sessionId = selected !== void 0 && ids.includes(selected) ? selected : ids[0];
			const [refresh, setRefresh] = (0, react.useState)(0);
			const [state, setState] = (0, react.useState)({
				loading: false,
				skills: []
			});
			(0, react.useEffect)(() => subscribeCatalogChanges((changed) => {
				if (changed === void 0 || changed === sessionId) setRefresh((value) => value + 1);
			}, sessionId), [sessionId]);
			(0, react.useEffect)(() => {
				if (sessionId === void 0) return;
				const abort = new AbortController();
				setState({
					sessionId,
					loading: true,
					skills: []
				});
				listAvailableSkills(sessionId, abort.signal).then((skills) => {
					if (!abort.signal.aborted) setState({
						sessionId,
						loading: false,
						skills
					});
				}, (error) => {
					if (!abort.signal.aborted) setState({
						sessionId,
						loading: false,
						skills: [],
						error: error instanceof Error ? error.message : String(error)
					});
				});
				return () => abort.abort();
			}, [
				sessionId,
				refreshKey,
				refresh
			]);
			const current = state.sessionId === sessionId ? state : void 0;
			const loading = sessionId !== void 0 && (current === void 0 || current.loading);
			const skills = current?.skills ?? [];
			const normalized = query.trim().toLocaleLowerCase();
			const filtered = skills.filter((skill) => [
				skill.name,
				skill.description,
				skill.whenToUse ?? "",
				skill.path ?? ""
			].some((value) => value.toLocaleLowerCase().includes(normalized)));
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: skill_collections_module_css_default.availableSkills,
				"aria-label": "原生会话可用 Skill 目录",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: skill_collections_module_css_default.sectionHeader,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: "当前会话可用 Skill" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: "与原生 / 菜单使用同一目录，包含未托管、本地、全局、内置和预设技能；不同会话的预设可能不同。" })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: skill_collections_module_css_default.badge,
							children: loading ? "…" : `${filtered.length} / ${skills.length}`
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: skill_collections_module_css_default.listToolbar,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
							className: skill_collections_module_css_default.catalogSession,
							children: ["查看会话", /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
								"aria-label": "选择 Skill 目录所属会话",
								value: sessionId ?? "",
								onChange: (event) => setSelected(event.currentTarget.value),
								children: [ids.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
									value: "",
									children: "暂无会话"
								}), ids.map((id) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("option", {
									value: id,
									children: [id === preferredSessionId ? "当前会话 · " : "会话 · ", id.slice(0, 12)]
								}, id))]
							})]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							className: skill_collections_module_css_default.catalogRefresh,
							type: "button",
							disabled: loading || sessionId === void 0,
							onClick: () => setRefresh((value) => value + 1),
							children: "刷新目录"
						})]
					}),
					sessionId === void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: skill_collections_module_css_default.emptyCompact,
						children: "此工作区暂无会话。新建会话后，可按它的实际工作目录和预设查看完整 Skill 列表。"
					}),
					loading && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: skill_collections_module_css_default.emptyCompact,
						role: "status",
						children: "正在读取原生 Skill 目录…"
					}),
					current?.error && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: skill_collections_module_css_default.error,
						role: "alert",
						children: [current.error, "。未用托管库列表替代原生结果，请刷新重试。"]
					}),
					!loading && !current?.error && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: skill_collections_module_css_default.catalogList,
						children: [filtered.map((skill) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: skill_collections_module_css_default.row,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: skill_collections_module_css_default.rowMain,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: skill_collections_module_css_default.rowTitle,
										children: [
											"/",
											skill.name,
											" ",
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: `${skill_collections_module_css_default.status} ${skill_collections_module_css_default.status_linked}`,
												children: skill.modelInvocable ? "可用" : "仅手动调用"
											})
										]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: skill_collections_module_css_default.rowDescription,
										children: skill.description
									}),
									skill.path && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: skill_collections_module_css_default.path,
										children: skill.path
									})
								]
							})
						}, skill.name)), sessionId !== void 0 && filtered.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: skill_collections_module_css_default.emptyCompact,
							children: skills.length === 0 ? "原生目录中暂无可手动调用的 Skill。" : "没有匹配的可用 Skill。"
						})]
					})
				]
			});
		}
		//#endregion
		//#region src/client/SkillCollectionsPanel.tsx
		const EMPTY_DRAFT = {
			id: "",
			name: "",
			description: "",
			skills: []
		};
		const MAX_UPLOAD_FILES = 500;
		const MAX_UPLOAD_FILE_BYTES = 4 * 1024 * 1024;
		const MAX_UPLOAD_TOTAL_BYTES = 12 * 1024 * 1024;
		function errorText(error) {
			return error instanceof Error ? error.message : String(error);
		}
		function readAsBase64(file) {
			return new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = () => {
					const result = String(reader.result);
					const comma = result.indexOf(",");
					resolve(comma >= 0 ? result.slice(comma + 1) : result);
				};
				reader.onerror = () => reject(reader.error ?? /* @__PURE__ */ new Error(`无法读取 ${file.name}`));
				reader.readAsDataURL(file);
			});
		}
		async function uploadFilesFromSelection(selected) {
			if (selected.length === 0 || selected.length > MAX_UPLOAD_FILES) throw new Error(`请选择包含 1-${MAX_UPLOAD_FILES} 个文件的单个 Skill 目录`);
			if (new Set(selected.map((file) => file.webkitRelativePath.split("/")[0]).filter(Boolean)).size !== 1) throw new Error("一次只能选择一个 Skill 目录");
			const files = [];
			let totalBytes = 0;
			for (const file of selected) {
				const path = file.webkitRelativePath.split("/").slice(1).join("/");
				if (!path) continue;
				if (file.size > MAX_UPLOAD_FILE_BYTES) throw new Error(`单个文件超过 4 MiB：${path}`);
				totalBytes += file.size;
				if (totalBytes > MAX_UPLOAD_TOTAL_BYTES) throw new Error("Skill 目录总大小超过 12 MiB");
				files.push({
					path,
					content: await readAsBase64(file)
				});
			}
			if (!files.some((file) => file.path === "SKILL.md")) throw new Error("请选择根目录含有 SKILL.md 的单个 Skill 目录");
			return files;
		}
		function SkillRow({ skill, scope, action, onDetails }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: skill_collections_module_css_default.skillRow,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: skill_collections_module_css_default.skillSummary,
					onClick: onDetails,
					title: skill.description,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: skill.name }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: skill_collections_module_css_default.skillScope,
							children: scope
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: skill_collections_module_css_default.skillDescription,
							children: skill.description
						})
					]
				}), action && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: skill_collections_module_css_default.rowActions,
					children: action
				})]
			});
		}
		function SkillCollectionsPanel({ initialWorkspaceId, initialSessionId, initialTab = "library", context }) {
			const requestedWorkspaceId = context?.workspaceId ?? initialWorkspaceId;
			const requestedTab = context?.workspaceId === void 0 ? initialTab : "workspace";
			const [tab, setTab] = (0, react.useState)(requestedTab);
			const [snapshot, setSnapshot] = (0, react.useState)(null);
			const [workspaceId, setWorkspaceId] = (0, react.useState)(requestedWorkspaceId ?? "");
			const workspaceIdRef = (0, react.useRef)(workspaceId);
			workspaceIdRef.current = workspaceId;
			const loadRequestRef = (0, react.useRef)(0);
			const [loading, setLoading] = (0, react.useState)(true);
			const [busy, setBusy] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)(null);
			const [notice, setNotice] = (0, react.useState)(null);
			const [draft, setDraft] = (0, react.useState)(EMPTY_DRAFT);
			const [collectionEditorOpen, setCollectionEditorOpen] = (0, react.useState)(false);
			const [collectionSkillQuery, setCollectionSkillQuery] = (0, react.useState)("");
			const [libraryQuery, setLibraryQuery] = (0, react.useState)("");
			const [librarySort, setLibrarySort] = (0, react.useState)("name-asc");
			const [collectionQuery, setCollectionQuery] = (0, react.useState)("");
			const [collectionSort, setCollectionSort] = (0, react.useState)("name-asc");
			const [workspaceSkillQuery, setWorkspaceSkillQuery] = (0, react.useState)("");
			const [workspaceStatusFilter, setWorkspaceStatusFilter] = (0, react.useState)("all");
			const [selectedSkill, setSelectedSkill] = (0, react.useState)(null);
			const [openingPath, setOpeningPath] = (0, react.useState)(false);
			const directoryInputRef = (0, react.useRef)(null);
			const [confirmation, setConfirmation] = (0, react.useState)(null);
			const confirmationController = (0, react.useMemo)(() => new ConfirmationController(setConfirmation), []);
			(0, react.useEffect)(() => {
				confirmationController.activate();
				return () => confirmationController.dispose();
			}, [confirmationController]);
			const load = (0, react.useCallback)(async (nextWorkspaceId = workspaceIdRef.current) => {
				const request = ++loadRequestRef.current;
				setLoading(true);
				setError(null);
				try {
					const value = await rpc("snapshot", nextWorkspaceId ? { workspaceId: nextWorkspaceId } : {});
					if (request !== loadRequestRef.current) return;
					if (!nextWorkspaceId && value.workspaces[0]) {
						const id = value.workspaces[0].id;
						setWorkspaceId(id);
						const selected = await rpc("snapshot", { workspaceId: id });
						if (request === loadRequestRef.current) setSnapshot(selected);
					} else setSnapshot(value);
				} catch (caught) {
					if (request === loadRequestRef.current) setError(errorText(caught));
				} finally {
					if (request === loadRequestRef.current) setLoading(false);
				}
			}, []);
			(0, react.useEffect)(() => () => {
				loadRequestRef.current += 1;
			}, []);
			(0, react.useEffect)(() => {
				if (requestedWorkspaceId !== void 0) {
					setWorkspaceId(requestedWorkspaceId);
					setTab(requestedTab);
				}
				load(requestedWorkspaceId ?? "");
			}, [
				requestedTab,
				requestedWorkspaceId,
				load
			]);
			const mutate = (0, react.useCallback)(async (endpoint, args, success) => {
				setBusy(true);
				setError(null);
				setNotice(null);
				try {
					await rpc(endpoint, args);
					setNotice(success);
					await load();
					return true;
				} catch (caught) {
					setError(errorText(caught));
					return false;
				} finally {
					setBusy(false);
				}
			}, [load]);
			const collectionMap = (0, react.useMemo)(() => new Map(snapshot?.collections.map((item) => [item.id, item]) ?? []), [snapshot]);
			const globalMap = (0, react.useMemo)(() => new Map(snapshot?.globalSkills.map((item) => [item.name, item]) ?? []), [snapshot]);
			const workspace = snapshot?.workspace?.id === workspaceId ? snapshot.workspace : void 0;
			const toggleGlobal = async (name, enabled) => {
				const message = enabled ? `将“${name}”设为全局 Skill？它将对所有工作区生效，托管库原件和已有工作区绑定保持不变。` : `取消“${name}”的全局启用？只移除本插件创建的全局链接；托管库原件和已有工作区绑定保持不变。`;
				if (await confirmationController.request({
					title: enabled ? "设为全局 Skill" : "取消全局 Skill",
					message,
					confirmLabel: enabled ? "设为全局" : "取消全局"
				})) await mutate("global-skill", {
					name,
					enabled
				}, `Skill “${name}”已${enabled ? "设为全局" : "取消全局"}`);
			};
			const deleteSkill = async (name) => {
				if (!await confirmationController.request({
					title: "删除托管 Skill",
					message: `确定删除“${name}”？这会删除托管库中的 Skill 文件，无法撤销。若仍被引用，需要再次确认。`,
					confirmLabel: "删除 Skill",
					danger: true
				})) return;
				if (!await mutate("library-delete", { name }, `Skill “${name}”已删除`) && await confirmationController.request({
					title: "强制删除 Skill",
					message: `“${name}”删除失败。若它仍被收藏夹或工作区引用，强制删除会保留这些引用并产生缺失诊断。确定继续？全局链接保护不会被绕过。`,
					confirmLabel: "强制删除",
					danger: true
				})) await mutate("library-delete", {
					name,
					force: true
				}, `Skill “${name}”已强制删除`);
			};
			const adoptSkill = async (name) => {
				if (await confirmationController.request({
					title: "收纳全局 Skill",
					message: `将“${name}”从全局目录收纳到托管库？全局原件会被移除，它将不再对所有工作区自动生效。`,
					confirmLabel: "收纳并移除全局原件",
					danger: true
				})) await mutate("library-adopt-global", { name }, `Skill “${name}”已收纳`);
			};
			const deleteCurrentCollection = async () => {
				const { id, name } = draft;
				if (!await confirmationController.request({
					title: "删除收藏夹",
					message: `确定删除收藏夹“${name}”？只删除收藏夹定义，不会删除 Skill 文件。`,
					confirmLabel: "删除收藏夹",
					danger: true
				})) return;
				let ok = await mutate("collection-delete", { id }, "收藏夹已删除");
				if (!ok && await confirmationController.request({
					title: "解绑并删除收藏夹",
					message: `“${name}”删除失败。若它已绑定工作区，强制删除将先从这些工作区解绑，再删除收藏夹。Skill 文件仍会保留。`,
					confirmLabel: "解绑并删除",
					danger: true
				})) ok = await mutate("collection-delete", {
					id,
					force: true
				}, "收藏夹已解绑并删除");
				if (ok) {
					setDraft(EMPTY_DRAFT);
					setCollectionEditorOpen(false);
				}
			};
			const editCollection = (collection) => {
				setDraft(collection === void 0 ? EMPTY_DRAFT : {
					id: collection.id,
					name: collection.name,
					description: collection.description,
					skills: [...collection.skills]
				});
				setCollectionSkillQuery("");
				setCollectionEditorOpen(true);
			};
			const saveDraft = async () => {
				if (await mutate("collection-save", { ...draft }, `收藏夹“${draft.name || draft.id}”已保存`)) {
					setDraft(EMPTY_DRAFT);
					setCollectionEditorOpen(false);
				}
			};
			const toggleDraftSkill = (name) => {
				setDraft((current) => ({
					...current,
					skills: current.skills.includes(name) ? current.skills.filter((skill) => skill !== name) : [...current.skills, name].sort()
				}));
			};
			const chooseSkillDirectory = (event) => {
				const selected = Array.from(event.target.files ?? []);
				event.target.value = "";
				if (selected.length === 0) return;
				setBusy(true);
				setError(null);
				setNotice(null);
				uploadFilesFromSelection(selected).then((files) => rpc("library-upload", { files })).then(async (result) => {
					setNotice(`Skill “${result.skill.name}”已导入固定托管库`);
					await load();
				}).catch((caught) => setError(errorText(caught))).finally(() => setBusy(false));
			};
			const editingExistingCollection = collectionMap.has(draft.id);
			const openSkillDirectory = async () => {
				if (selectedSkill === null || openingPath) return;
				setOpeningPath(true);
				setError(null);
				try {
					await openPath(selectedSkill.skill.path);
				} catch (caught) {
					setError(errorText(caught));
				} finally {
					setOpeningPath(false);
				}
			};
			const selectableSkills = (0, react.useMemo)(() => {
				const query = collectionSkillQuery.trim().toLocaleLowerCase();
				const rows = snapshot?.library ?? [];
				if (!query) return rows;
				return rows.filter((skill) => skill.name.toLocaleLowerCase().includes(query) || skill.description.toLocaleLowerCase().includes(query));
			}, [collectionSkillQuery, snapshot]);
			const normalizedLibraryQuery = libraryQuery.trim().toLocaleLowerCase();
			const matchesSkill = (0, react.useCallback)((skill) => normalizedLibraryQuery === "" || skill.name.toLocaleLowerCase().includes(normalizedLibraryQuery) || skill.description.toLocaleLowerCase().includes(normalizedLibraryQuery), [normalizedLibraryQuery]);
			const sortSkills = (0, react.useCallback)((skills) => skills.slice().sort((a, b) => {
				if (librarySort === "description") {
					const descriptionOrder = a.description.localeCompare(b.description);
					return descriptionOrder !== 0 ? descriptionOrder : a.name.localeCompare(b.name);
				}
				const nameOrder = a.name.localeCompare(b.name);
				return librarySort === "name-desc" ? -nameOrder : nameOrder;
			}), [librarySort]);
			const filteredLibrary = (0, react.useMemo)(() => sortSkills((snapshot?.library ?? []).filter(matchesSkill)), [
				matchesSkill,
				snapshot,
				sortSkills
			]);
			const filteredGlobalSkills = (0, react.useMemo)(() => sortSkills((snapshot?.globalSkills ?? []).filter(matchesSkill)), [
				matchesSkill,
				snapshot,
				sortSkills
			]);
			const normalizedCollectionQuery = collectionQuery.trim().toLocaleLowerCase();
			const filteredCollections = (0, react.useMemo)(() => (snapshot?.collections ?? []).filter((collection) => normalizedCollectionQuery === "" || collection.name.toLocaleLowerCase().includes(normalizedCollectionQuery) || collection.id.toLocaleLowerCase().includes(normalizedCollectionQuery) || collection.description.toLocaleLowerCase().includes(normalizedCollectionQuery) || collection.skills.some((skill) => skill.toLocaleLowerCase().includes(normalizedCollectionQuery))).sort((a, b) => {
				if (collectionSort === "count-desc") return b.skills.length - a.skills.length || a.name.localeCompare(b.name);
				return a.name.localeCompare(b.name);
			}), [
				collectionSort,
				normalizedCollectionQuery,
				snapshot
			]);
			const normalizedWorkspaceQuery = workspaceSkillQuery.trim().toLocaleLowerCase();
			const matchesWorkspaceSkill = (name) => normalizedWorkspaceQuery === "" || name.toLocaleLowerCase().includes(normalizedWorkspaceQuery);
			const filteredWorkspaceSkills = (0, react.useMemo)(() => (snapshot?.library ?? []).filter((skill) => matchesWorkspaceSkill(skill.name)), [normalizedWorkspaceQuery, snapshot]);
			const filteredEffectiveSkills = (0, react.useMemo)(() => (workspace?.effective ?? []).filter((skill) => {
				if (!matchesWorkspaceSkill(skill.name)) return false;
				if (workspaceStatusFilter === "linked") return skill.status === "linked" || skill.status === "global";
				if (workspaceStatusFilter === "problem") return skill.status !== "linked" && skill.status !== "global";
				return true;
			}), [
				normalizedWorkspaceQuery,
				snapshot,
				workspace,
				workspaceStatusFilter
			]);
			if (loading && snapshot === null) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: skill_collections_module_css_default.empty,
				children: "正在加载 Skill 收藏夹…"
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: skill_collections_module_css_default.root,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
						className: skill_collections_module_css_default.header,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", { children: "Skill 收藏夹" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: "显式组织 Skill 集合并绑定到工作区；插件不会自动识别项目类型。" })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "outline",
							size: "sm",
							disabled: loading || busy,
							onClick: () => void load(),
							children: "刷新"
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("nav", {
						className: skill_collections_module_css_default.tabs,
						"aria-label": "Skill 收藏夹功能",
						children: [
							["library", "Skill 库"],
							["collections", "收藏夹"],
							["workspace", "工作区"]
						].map(([id, label]) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: tab === id ? skill_collections_module_css_default.tabActive : skill_collections_module_css_default.tab,
							onClick: () => setTab(id),
							children: label
						}, id))
					}),
					error && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: skill_collections_module_css_default.error,
						role: "alert",
						children: error
					}),
					notice && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: skill_collections_module_css_default.notice,
						children: notice
					}),
					tab === "library" && snapshot && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: skill_collections_module_css_default.section,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: skill_collections_module_css_default.sectionHeader,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: "托管 Skill 库" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: "存储位置固定；这里不会被 DSH 自动扫描，只有绑定工作区后才会生成原生链接。" })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: skill_collections_module_css_default.badge,
									children: snapshot.library.length
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: skill_collections_module_css_default.libraryLocation,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: "固定托管目录" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: snapshot.paths.library })] }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										variant: "primary",
										size: "sm",
										disabled: busy,
										onClick: () => directoryInputRef.current?.click(),
										children: busy ? "正在导入…" : "选择 Skill 目录"
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										ref: directoryInputRef,
										type: "file",
										multiple: true,
										className: skill_collections_module_css_default.hiddenInput,
										webkitdirectory: "",
										directory: "",
										onChange: chooseSkillDirectory
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: skill_collections_module_css_default.listToolbar,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
										className: skill_collections_module_css_default.listSearch,
										value: libraryQuery,
										onChange: (event) => setLibraryQuery(event.target.value),
										placeholder: "搜索托管和全局 Skill…"
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
										className: skill_collections_module_css_default.filterSelect,
										value: librarySort,
										onChange: (event) => setLibrarySort(event.target.value),
										"aria-label": "Skill 排序",
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
												value: "name-asc",
												children: "名称 A-Z"
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
												value: "name-desc",
												children: "名称 Z-A"
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
												value: "description",
												children: "按描述"
											})
										]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: skill_collections_module_css_default.resultCount,
										children: [
											filteredLibrary.length + filteredGlobalSkills.length,
											" / ",
											snapshot.library.length + snapshot.globalSkills.length
										]
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: skill_collections_module_css_default.list,
								children: [
									snapshot.library.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: skill_collections_module_css_default.empty,
										children: "托管库为空。请选择根目录包含 SKILL.md 的 Skill 文件夹，或从下方全局 Skill 中收纳。"
									}),
									snapshot.library.length > 0 && filteredLibrary.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: skill_collections_module_css_default.emptyCompact,
										children: "没有匹配的托管 Skill。"
									}),
									filteredLibrary.map((skill) => {
										const global = globalMap.get(skill.name);
										return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SkillRow, {
											skill,
											scope: global ? "托管 · 全局" : "托管",
											onDetails: () => setSelectedSkill({
												skill,
												scope: "托管 Skill"
											}),
											action: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
												variant: "outline",
												size: "sm",
												disabled: busy || global !== void 0 && !global.globalManaged,
												onClick: () => void toggleGlobal(skill.name, global === void 0),
												children: global === void 0 ? "设为全局" : global.globalManaged ? "取消全局" : "全局（外部）"
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
												className: skill_collections_module_css_default.dangerLink,
												variant: "ghost",
												size: "sm",
												disabled: busy || global?.globalManaged,
												title: global?.globalManaged ? "请先取消全局，再删除托管 Skill" : void 0,
												onClick: () => void deleteSkill(skill.name),
												children: "删除"
											})] })
										}, skill.name);
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: skill_collections_module_css_default.sectionHeaderSecondary,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: "当前全局 Skill" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: "对所有工作区生效。托管链接可直接“取消全局”；外部 Skill 的“收纳”会复制到托管库并移除全局原件。" })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: skill_collections_module_css_default.badgeMuted,
									children: [
										filteredGlobalSkills.length,
										" / ",
										snapshot.globalSkills.length
									]
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: skill_collections_module_css_default.list,
								children: [
									snapshot.globalSkills.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: skill_collections_module_css_default.emptyCompact,
										children: "暂无全局 Skill。可在托管 Skill 旁点击“设为全局”。"
									}),
									snapshot.globalSkills.length > 0 && filteredGlobalSkills.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: skill_collections_module_css_default.emptyCompact,
										children: "没有匹配的全局 Skill。"
									}),
									filteredGlobalSkills.map((skill) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SkillRow, {
										skill,
										scope: skill.globalManaged ? "全局 · 托管链接" : "全局 · 外部",
										onDetails: () => setSelectedSkill({
											skill,
											scope: "全局 Skill"
										}),
										action: skill.globalManaged ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
											variant: "outline",
											size: "sm",
											disabled: busy,
											onClick: () => void toggleGlobal(skill.name, false),
											children: "取消全局"
										}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
											variant: "outline",
											size: "sm",
											disabled: busy || snapshot.library.some((item) => item.name === skill.name),
											onClick: () => void adoptSkill(skill.name),
											children: "收纳"
										})
									}, skill.name))
								]
							})
						]
					}),
					tab === "collections" && snapshot && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: skill_collections_module_css_default.section,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: skill_collections_module_css_default.sectionHeader,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: "收藏夹" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: "每个收藏夹是一组 Skill 引用。点击一行即可查看或编辑。" })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
									variant: "primary",
									size: "sm",
									onClick: () => editCollection(),
									children: "新建收藏夹"
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: skill_collections_module_css_default.listToolbar,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
										className: skill_collections_module_css_default.listSearch,
										value: collectionQuery,
										onChange: (event) => setCollectionQuery(event.target.value),
										placeholder: "搜索收藏夹、描述或 Skill…"
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
										className: skill_collections_module_css_default.filterSelect,
										value: collectionSort,
										onChange: (event) => setCollectionSort(event.target.value),
										"aria-label": "收藏夹排序",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value: "name-asc",
											children: "名称 A-Z"
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value: "count-desc",
											children: "Skill 数量"
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: skill_collections_module_css_default.resultCount,
										children: [
											filteredCollections.length,
											" / ",
											snapshot.collections.length
										]
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: skill_collections_module_css_default.collectionRows,
								children: [
									filteredCollections.map((collection) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: skill_collections_module_css_default.collectionRow,
										onClick: () => editCollection(collection),
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: collection.name }),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: skill_collections_module_css_default.collectionDescription,
												children: collection.description || collection.id
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
												className: skill_collections_module_css_default.collectionCount,
												children: [collection.skills.length, " 个 Skill"]
											})
										]
									}, collection.id)),
									snapshot.collections.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: skill_collections_module_css_default.empty,
										children: "还没有收藏夹。点击“新建收藏夹”开始整理 Skill。"
									}),
									snapshot.collections.length > 0 && filteredCollections.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: skill_collections_module_css_default.emptyCompact,
										children: "没有匹配的收藏夹。"
									})
								]
							})
						]
					}),
					tab === "workspace" && snapshot && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: skill_collections_module_css_default.section,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: skill_collections_module_css_default.workspaceToolbar,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: ["工作区", /* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
									value: workspaceId,
									onChange: (event) => {
										const id = event.target.value;
										setWorkspaceId(id);
										load(id);
									},
									children: snapshot.workspaces.map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("option", {
										value: item.id,
										children: [
											item.title,
											" — ",
											item.path
										]
									}, item.id))
								})] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
									variant: "outline",
									size: "sm",
									disabled: busy || !workspaceId,
									onClick: () => void mutate("workspace-sync", { workspaceId }, "工作区链接已同步"),
									children: "重新同步"
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: skill_collections_module_css_default.listToolbar,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
									className: skill_collections_module_css_default.listSearch,
									value: workspaceSkillQuery,
									onChange: (event) => setWorkspaceSkillQuery(event.target.value),
									placeholder: "搜索当前工作区 Skill…"
								})
							}),
							!workspace && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: skill_collections_module_css_default.empty,
								children: "请选择已注册的工作区。"
							}),
							workspace && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(AvailableSkills, {
									sessionIds: snapshot.workspaces.find((item) => item.id === workspace.id)?.sessionIds ?? [],
									preferredSessionId: workspace.id === requestedWorkspaceId ? initialSessionId : void 0,
									query: workspaceSkillQuery,
									refreshKey: snapshot
								}, `${workspace.id}:${workspace.id === requestedWorkspaceId ? initialSessionId ?? "" : ""}`),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: skill_collections_module_css_default.workspaceColumns,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: "启用收藏夹" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: skill_collections_module_css_default.toggleList,
										children: snapshot.collections.filter((collection) => normalizedWorkspaceQuery === "" || collection.name.toLocaleLowerCase().includes(normalizedWorkspaceQuery) || collection.skills.some((skill) => skill.toLocaleLowerCase().includes(normalizedWorkspaceQuery))).map((collection) => {
											const enabled = workspace.config.collections.includes(collection.id);
											return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
												className: skill_collections_module_css_default.toggleRow,
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
													type: "checkbox",
													checked: enabled,
													disabled: busy,
													onChange: () => void mutate("workspace-collection", {
														workspaceId,
														id: collection.id,
														enabled: !enabled
													}, enabled ? "收藏夹已从工作区移除" : "收藏夹已绑定到工作区")
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: collection.name }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: collection.skills.join("、") || "空收藏夹" })] })]
											}, collection.id);
										})
									})] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: "单个 Skill 覆盖" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: skill_collections_module_css_default.toggleList,
										children: [filteredWorkspaceSkills.map((skill) => {
											const direct = workspace.config.skills.enabled.includes(skill.name);
											const global = globalMap.has(skill.name);
											const disabled = workspace.config.skills.disabled.includes(skill.name);
											const effective = workspace.effective.some((item) => item.name === skill.name);
											const mode = disabled ? "clear" : effective && !direct ? "disable" : direct ? "clear" : "enable";
											const label = disabled ? "清除禁用" : effective && !direct ? "在此禁用" : direct ? "移除单独启用" : "单独启用";
											return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												className: skill_collections_module_css_default.overrideRow,
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: skill.name }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: global ? "全局生效，工作区覆盖不能屏蔽全局 Skill" : disabled ? "工作区禁用覆盖" : direct ? "工作区单独启用" : effective ? "来自收藏夹" : "未启用" })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
													variant: "outline",
													size: "sm",
													disabled: busy || global,
													onClick: () => void mutate("workspace-skill", {
														workspaceId,
														skill: skill.name,
														mode
													}, `${skill.name}: ${label}`),
													children: global ? "全局生效" : label
												})]
											}, skill.name);
										}), filteredWorkspaceSkills.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: skill_collections_module_css_default.emptyCompact,
											children: "没有匹配的托管 Skill。"
										})]
									})] })]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
									className: skill_collections_module_css_default.bindingDiagnostics,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", { children: "托管绑定与全局目录诊断（不是完整可用目录）" }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: skill_collections_module_css_default.sectionHeaderSecondary,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: "绑定诊断" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: "用于检查本插件的链接、全局目录及冲突；实际可用技能以上方原生会话目录为准。" })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
												className: skill_collections_module_css_default.badge,
												children: [
													filteredEffectiveSkills.length,
													" / ",
													workspace.effective.length
												]
											})]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: skill_collections_module_css_default.listToolbar,
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
												className: skill_collections_module_css_default.filterSelect,
												value: workspaceStatusFilter,
												onChange: (event) => setWorkspaceStatusFilter(event.target.value),
												"aria-label": "筛选托管绑定诊断状态",
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
														value: "all",
														children: "全部绑定状态"
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
														value: "linked",
														children: "已链接 / 全局"
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
														value: "problem",
														children: "异常项"
													})
												]
											})
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: skill_collections_module_css_default.list,
											children: [
												filteredEffectiveSkills.map((skill) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													className: skill_collections_module_css_default.row,
													children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
														className: skill_collections_module_css_default.rowMain,
														children: [
															/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
																className: skill_collections_module_css_default.rowTitle,
																children: [
																	skill.name,
																	" ",
																	/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																		className: `${skill_collections_module_css_default.status} ${skill_collections_module_css_default[`status_${skill.status}`]}`,
																		children: skill.status === "global" ? "全局生效" : skill.status
																	})
																]
															}),
															/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
																className: skill_collections_module_css_default.rowDescription,
																children: skill.sources.map((source) => source === "global" ? "全局" : source === "workspace:local" ? "工作区本地" : source).join(" · ")
															}),
															skill.detail && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
																className: skill_collections_module_css_default.warning,
																children: skill.detail
															}),
															skill.targetPath && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
																className: skill_collections_module_css_default.path,
																children: skill.targetPath
															})
														]
													})
												}, skill.name)),
												workspace.effective.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													className: skill_collections_module_css_default.empty,
													children: "该工作区暂无全局或托管 Skill。"
												}),
												workspace.effective.length > 0 && filteredEffectiveSkills.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													className: skill_collections_module_css_default.emptyCompact,
													children: "没有匹配的绑定诊断。"
												})
											]
										})
									]
								})
							] })
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
						open: selectedSkill !== null,
						onClose: () => setSelectedSkill(null),
						title: selectedSkill?.skill.name ?? "Skill 详情",
						closeLabel: "关闭",
						description: selectedSkill?.scope,
						className: skill_collections_module_css_default.detailModal,
						footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [selectedSkill?.skill.layout === "directory" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "outline",
							size: "sm",
							disabled: openingPath,
							onClick: () => void openSkillDirectory(),
							children: openingPath ? "正在打开…" : "打开目录"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "primary",
							size: "sm",
							onClick: () => setSelectedSkill(null),
							children: "完成"
						})] }),
						children: selectedSkill && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dl", {
							className: skill_collections_module_css_default.detailList,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: "说明" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: selectedSkill.skill.description })] }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: "格式" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: selectedSkill.skill.layout === "directory" ? "目录型 Skill" : "平铺 Markdown Skill" })] }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: "路径" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: selectedSkill.skill.path }) })] }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: "符号链接" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: selectedSkill.skill.isSymlink ? selectedSkill.skill.linkTarget ?? "是" : "否" })] })
							]
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
						open: collectionEditorOpen,
						onClose: () => !busy && setCollectionEditorOpen(false),
						title: editingExistingCollection ? "编辑收藏夹" : "新建收藏夹",
						closeLabel: "关闭",
						description: "收藏夹只保存 Skill 引用，不复制或移动 Skill 文件。",
						className: skill_collections_module_css_default.collectionModal,
						contentClassName: skill_collections_module_css_default.collectionModalContent,
						footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
							editingExistingCollection && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								className: skill_collections_module_css_default.modalDelete,
								variant: "outline",
								size: "sm",
								disabled: busy,
								onClick: () => void deleteCurrentCollection(),
								children: "删除"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "ghost",
								size: "sm",
								disabled: busy,
								onClick: () => setCollectionEditorOpen(false),
								children: "取消"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "primary",
								size: "sm",
								disabled: busy || !draft.id || !draft.name,
								onClick: () => void saveDraft(),
								children: "保存"
							})
						] }),
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: skill_collections_module_css_default.modalForm,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: ["ID", /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									value: draft.id,
									disabled: editingExistingCollection,
									onChange: (event) => setDraft((current) => ({
										...current,
										id: event.target.value
									})),
									placeholder: "unity-development"
								})] }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: ["名称", /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									value: draft.name,
									onChange: (event) => setDraft((current) => ({
										...current,
										name: event.target.value
									})),
									placeholder: "Unity 开发"
								})] }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: ["说明", /* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
									value: draft.description,
									onChange: (event) => setDraft((current) => ({
										...current,
										description: event.target.value
									})),
									rows: 3,
									placeholder: "这个收藏夹适合什么工作"
								})] }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: skill_collections_module_css_default.skillPickerHeader,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: "选择 Skill" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
										"已选择 ",
										draft.skills.length,
										" 个"
									] })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
										className: skill_collections_module_css_default.skillSearch,
										value: collectionSkillQuery,
										onChange: (event) => setCollectionSkillQuery(event.target.value),
										placeholder: "搜索 Skill"
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: skill_collections_module_css_default.modalSkillList,
									children: [selectableSkills.map((skill) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										className: skill_collections_module_css_default.modalSkillRow,
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
												type: "checkbox",
												checked: draft.skills.includes(skill.name),
												onChange: () => toggleDraftSkill(skill.name)
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: skill.name }),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: skill.description })
										]
									}, skill.name)), selectableSkills.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: skill_collections_module_css_default.emptyCompact,
										children: "没有匹配的 Skill。"
									})]
								})
							]
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
						open: confirmation !== null,
						onClose: () => confirmationController.answer(false),
						title: confirmation?.title ?? "确认操作",
						closeLabel: "取消操作",
						className: skill_collections_module_css_default.confirmationModal,
						footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "outline",
							size: "sm",
							"data-modal-autofocus": true,
							onClick: () => confirmationController.answer(false),
							children: "取消"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: confirmation?.danger ? "outline" : "primary",
							className: confirmation?.danger ? skill_collections_module_css_default.dangerButton : void 0,
							size: "sm",
							onClick: () => confirmationController.answer(true),
							children: confirmation?.confirmLabel ?? "确认"
						})] }),
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: skill_collections_module_css_default.confirmationMessage,
							children: confirmation?.message
						})
					})
				]
			});
		}
		//#endregion
		//#region src/client/LightningIcon.tsx
		/** Compact filled lightning glyph shared by the two composer Skill entries. */
		function LightningIcon({ size = 18, className }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 18 18",
				className,
				"aria-hidden": "true",
				focusable: "false",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					d: "M10.7 1.35 3.15 10.1h4.32l-.82 6.55 7.86-9.2h-4.47z",
					fill: "currentColor"
				})
			});
		}
		//#endregion
		//#region src/client/SkillManagementOverlay.tsx
		const SKILL_MANAGEMENT_OPEN_EVENT = "dsh:skill-collections:manage-current-workspace";
		/** Event-driven owner for the composer management button's modal. */
		function SkillManagementOverlay(_props) {
			const [request, setRequest] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				const onOpen = (event) => {
					const detail = event.detail;
					if (detail === null || typeof detail !== "object" || typeof detail.workspaceId !== "string") return;
					setRequest({
						workspaceId: detail.workspaceId,
						...typeof detail.title === "string" ? { title: detail.title } : {},
						...typeof detail.sessionId === "string" ? { sessionId: detail.sessionId } : {}
					});
				};
				window.addEventListener(SKILL_MANAGEMENT_OPEN_EVENT, onOpen);
				return () => window.removeEventListener(SKILL_MANAGEMENT_OPEN_EVENT, onOpen);
			}, []);
			return request === null ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
				open: true,
				onClose: () => setRequest(null),
				title: request.title === void 0 ? "Skill 管理" : `Skill 管理 · ${request.title}`,
				closeLabel: "关闭",
				className: skill_collections_module_css_default.managementModal,
				contentClassName: skill_collections_module_css_default.managementModalContent,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SkillCollectionsPanel, {
					initialWorkspaceId: request.workspaceId,
					initialSessionId: request.sessionId,
					initialTab: "workspace"
				})
			});
		}
		//#endregion
		//#region src/client/SkillManagementEntry.tsx
		/** The former settings/sidebar entry, moved beside the composer. */
		function SkillManagementEntry({ sessionId, useSessions, useWorkspaces }) {
			const sessionCwd = useSessions((state) => state.byId[sessionId]?.cwd);
			const workspaces = useWorkspaces((state) => state.items);
			const workspace = workspaces.find((item) => item.sessionIds.some((id) => String(id) === String(sessionId))) ?? workspaces.find((item) => item.path === sessionCwd);
			const openManager = (0, react.useCallback)(() => {
				if (workspace === void 0) return;
				window.dispatchEvent(new CustomEvent(SKILL_MANAGEMENT_OPEN_EVENT, { detail: {
					workspaceId: String(workspace.workspaceId),
					title: workspace.title,
					sessionId: String(sessionId)
				} }));
			}, [workspace, sessionId]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				className: `${skill_collections_module_css_default.quickButton} ${skill_collections_module_css_default.managementButton}`,
				onMouseDown: (event) => event.preventDefault(),
				onClick: openManager,
				disabled: workspace === void 0,
				title: "打开 Skill 管理",
				"aria-label": "打开 Skill 管理",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(LightningIcon, {})
			});
		}
		//#endregion
		//#region src/client/draft.ts
		/** Insert the native `/skill-name` gesture at a textarea range. */
		function buildInsertedDraft(draft, name, range) {
			if (range === void 0 || range.start < 0) {
				const text = `${draft}${draft === "" || draft.endsWith(" ") || draft.endsWith("\n") ? "" : " "}/${name} `;
				return {
					text,
					caret: text.length
				};
			}
			const start = Math.min(range.start, draft.length);
			const end = range.end > start ? Math.min(range.end, draft.length) : start;
			const prefix = draft.slice(0, start);
			const suffix = draft.slice(end);
			const before = prefix === "" || prefix.endsWith(" ") || prefix.endsWith("\n") ? "" : " ";
			const after = suffix === "" || suffix.startsWith(" ") || suffix.startsWith("\n") ? "" : " ";
			return {
				text: `${prefix}${before}/${name}${after}${suffix}`,
				caret: start + before.length + 1 + name.length + after.length
			};
		}
		//#endregion
		//#region src/client/picker-skills.ts
		function effectivePickerSkills(catalog) {
			return (catalog ?? []).map((skill) => ({
				name: skill.name,
				description: skill.description,
				scope: skill.modelInvocable ? "可用" : "仅手动"
			}));
		}
		//#endregion
		//#region src/client/SkillQuickPicker.tsx
		const USAGE_KEY = "dsh-skill-collections:skill-usage";
		const MAX_RECENT = 6;
		const UNSCOPED_WORKSPACE = "__unscoped__";
		function loadUsage(workspaceId) {
			try {
				const raw = localStorage.getItem(USAGE_KEY);
				if (raw === null) return {};
				return JSON.parse(raw)[workspaceId] ?? {};
			} catch {
				return {};
			}
		}
		function saveUsage(workspaceId, value) {
			try {
				const raw = localStorage.getItem(USAGE_KEY);
				const parsed = raw === null ? {} : JSON.parse(raw);
				parsed[workspaceId] = value;
				localStorage.setItem(USAGE_KEY, JSON.stringify(parsed));
			} catch {}
		}
		function rankByUsage(skills, usage) {
			return skills.slice().sort((a, b) => {
				const ua = usage[a.name];
				const ub = usage[b.name];
				const last = (ub?.lastUsed ?? 0) - (ua?.lastUsed ?? 0);
				if (last !== 0) return last;
				const count = (ub?.count ?? 0) - (ua?.count ?? 0);
				return count !== 0 ? count : a.name.localeCompare(b.name);
			});
		}
		function findComposerTextarea(box) {
			let current = box;
			while (current !== null) {
				const card = current.matches("[data-composer-card]") ? current : current.querySelector("[data-composer-card]");
				if (card !== null) {
					const textarea = card.querySelector("textarea");
					return textarea instanceof HTMLTextAreaElement ? textarea : null;
				}
				current = current.parentElement;
			}
			return null;
		}
		function SkillQuickPicker(props) {
			const sessionCwd = props.useSessions((state) => state.byId[props.sessionId]?.cwd);
			const workspaces = props.useWorkspaces((state) => state.items);
			const workspaceId = workspaces.find((workspace) => workspace.sessionIds.some((id) => String(id) === String(props.sessionId)))?.workspaceId ?? workspaces.find((workspace) => workspace.path === sessionCwd)?.workspaceId;
			const resolvedWorkspaceId = workspaceId === void 0 ? UNSCOPED_WORKSPACE : String(workspaceId);
			const draft = props.useInput((state) => state.draft);
			const [open, setOpen] = (0, react.useState)(false);
			const [query, setQuery] = (0, react.useState)("");
			const [catalog, setCatalog] = (0, react.useState)(null);
			const [loading, setLoading] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)(null);
			const [usage, setUsage] = (0, react.useState)(() => loadUsage(resolvedWorkspaceId));
			const [activeIndex, setActiveIndex] = (0, react.useState)(0);
			const boxRef = (0, react.useRef)(null);
			const textareaFocusedRef = (0, react.useRef)(false);
			const selectionRef = (0, react.useRef)(void 0);
			const requestRef = (0, react.useRef)(0);
			const abortRef = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				setUsage(loadUsage(resolvedWorkspaceId));
			}, [resolvedWorkspaceId]);
			const load = (0, react.useCallback)(async () => {
				const request = ++requestRef.current;
				abortRef.current?.abort();
				const abort = new AbortController();
				abortRef.current = abort;
				setCatalog(null);
				setLoading(true);
				setError(null);
				try {
					const value = await listAvailableSkills(String(props.sessionId), abort.signal);
					if (request === requestRef.current) setCatalog(value);
				} catch (caught) {
					if (request === requestRef.current) setError(caught instanceof Error ? caught.message : String(caught));
				} finally {
					if (request === requestRef.current) setLoading(false);
				}
			}, [props.sessionId, sessionCwd]);
			(0, react.useEffect)(() => {
				if (open) load();
				return () => {
					requestRef.current += 1;
					abortRef.current?.abort();
				};
			}, [open, load]);
			(0, react.useEffect)(() => {
				if (!open) return;
				return subscribeCatalogChanges((sessionId) => {
					if (sessionId === void 0 || sessionId === String(props.sessionId)) load();
				}, String(props.sessionId));
			}, [
				open,
				load,
				props.sessionId
			]);
			const toggle = () => {
				const textarea = findComposerTextarea(boxRef.current);
				if (textarea !== null && textarea.value === draft) {
					textareaFocusedRef.current = true;
					selectionRef.current = {
						start: textarea.selectionStart,
						end: textarea.selectionEnd
					};
				}
				setOpen((value) => !value);
				setQuery("");
				setActiveIndex(0);
			};
			const skills = (0, react.useMemo)(() => effectivePickerSkills(catalog), [catalog]);
			const ordered = (0, react.useMemo)(() => rankByUsage(skills, usage), [skills, usage]);
			const normalizedQuery = query.trim().toLocaleLowerCase();
			const filtered = ordered.filter((skill) => normalizedQuery === "" || skill.name.toLocaleLowerCase().includes(normalizedQuery) || skill.description.toLocaleLowerCase().includes(normalizedQuery));
			const recent = normalizedQuery === "" ? filtered.filter((skill) => (usage[skill.name]?.lastUsed ?? 0) > 0).slice(0, MAX_RECENT) : [];
			const recentNames = new Set(recent.map((skill) => skill.name));
			const rest = filtered.filter((skill) => !recentNames.has(skill.name));
			const items = [...recent, ...rest];
			const pick = (name) => {
				const currentDraft = typeof draft === "string" ? draft : "";
				let range;
				const textarea = findComposerTextarea(boxRef.current);
				if (textarea !== null && textarea.value === currentDraft && textareaFocusedRef.current) range = selectionRef.current ?? {
					start: textarea.selectionStart,
					end: textarea.selectionEnd
				};
				const inserted = buildInsertedDraft(currentDraft, name, range);
				props.inputActions.setDraft(inserted.text);
				const nextUsage = {
					...usage,
					[name]: {
						count: (usage[name]?.count ?? 0) + 1,
						lastUsed: Date.now()
					}
				};
				setUsage(nextUsage);
				saveUsage(resolvedWorkspaceId, nextUsage);
				setOpen(false);
				setQuery("");
				if (textarea !== null && typeof requestAnimationFrame === "function") requestAnimationFrame(() => {
					textarea.focus();
					if (textarea.value === inserted.text) textarea.setSelectionRange(inserted.caret, inserted.caret);
				});
			};
			(0, react.useEffect)(() => {
				if (!open) return;
				const onFocusIn = (event) => {
					const textarea = findComposerTextarea(boxRef.current);
					if (textarea !== null && event.target === textarea) {
						textareaFocusedRef.current = true;
						selectionRef.current = {
							start: textarea.selectionStart,
							end: textarea.selectionEnd
						};
					}
				};
				const onPointerDown = (event) => {
					if (boxRef.current !== null && event.target instanceof Node && !boxRef.current.contains(event.target)) setOpen(false);
				};
				const onKeyDown = (event) => {
					if (event.key === "Escape") {
						setOpen(false);
						return;
					}
					if (event.key === "ArrowDown") {
						event.preventDefault();
						setActiveIndex((index) => Math.min(index + 1, Math.max(items.length - 1, 0)));
					} else if (event.key === "ArrowUp") {
						event.preventDefault();
						setActiveIndex((index) => Math.max(index - 1, 0));
					} else if (event.key === "Enter" && items[activeIndex] !== void 0) {
						event.preventDefault();
						pick(items[activeIndex].name);
					}
				};
				document.addEventListener("focusin", onFocusIn);
				document.addEventListener("pointerdown", onPointerDown);
				document.addEventListener("keydown", onKeyDown);
				return () => {
					document.removeEventListener("focusin", onFocusIn);
					document.removeEventListener("pointerdown", onPointerDown);
					document.removeEventListener("keydown", onKeyDown);
				};
			}, [
				open,
				activeIndex,
				items,
				pick
			]);
			const renderItem = (skill, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				role: "option",
				"aria-selected": index === activeIndex,
				className: `${skill_collections_module_css_default.quickItem} ${index === activeIndex ? skill_collections_module_css_default.quickItemActive : ""}`,
				onMouseEnter: () => setActiveIndex(index),
				onClick: () => pick(skill.name),
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
					className: skill_collections_module_css_default.quickItemName,
					children: [
						"/",
						skill.name,
						" ",
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: skill.scope })
					]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: skill_collections_module_css_default.quickItemDescription,
					children: skill.description || "无描述"
				})]
			}, skill.name);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				ref: boxRef,
				className: skill_collections_module_css_default.quickPicker,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: `${skill_collections_module_css_default.quickButton} ${open ? skill_collections_module_css_default.quickButtonActive : ""}`,
					onClick: toggle,
					title: "选择当前工作区 Skill",
					"aria-label": "选择当前工作区 Skill",
					"aria-expanded": open,
					"aria-haspopup": "dialog",
					onMouseDown: (event) => event.preventDefault(),
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(LightningIcon, {}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutlineRegular, { className: skill_collections_module_css_default.quickChevron })]
				}), open && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: skill_collections_module_css_default.quickPopover,
					role: "dialog",
					"aria-label": "选择 Skill",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: skill_collections_module_css_default.quickHeader,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: skill_collections_module_css_default.quickTitle,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(LightningIcon, {}),
									" ",
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: "当前会话可用 Skill" }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: skills.length })
								]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: skill_collections_module_css_default.quickIconButton,
								onClick: () => void load(),
								title: "刷新 Skill 列表",
								"aria-label": "刷新 Skill 列表",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconRefreshOutlineRegular, { size: 14 })
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: skill_collections_module_css_default.quickSearchRow,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSearchOutlineRegular, {}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								className: skill_collections_module_css_default.quickSearch,
								value: query,
								onChange: (event) => {
									setQuery(event.currentTarget.value);
									setActiveIndex(0);
								},
								placeholder: "搜索名称或描述…",
								autoFocus: true
							})]
						}),
						loading && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: skill_collections_module_css_default.quickStatus,
							children: "正在读取原生会话 Skill 目录…"
						}),
						!loading && error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: skill_collections_module_css_default.quickStatusError,
							children: error
						}),
						!loading && error === null && items.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: skill_collections_module_css_default.quickStatus,
							children: skills.length === 0 ? "原生目录中暂无可手动调用的 Skill。" : "没有匹配的 Skill。"
						}),
						!loading && error === null && items.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: skill_collections_module_css_default.quickList,
							role: "listbox",
							"aria-label": "当前会话全部可用 Skill",
							children: [
								recent.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: skill_collections_module_css_default.quickSectionLabel,
									children: "最近使用"
								}),
								recent.map((skill, index) => renderItem(skill, index)),
								rest.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: skill_collections_module_css_default.quickSectionLabel,
									children: "全部技能"
								}),
								rest.map((skill, index) => renderItem(skill, recent.length + index))
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: skill_collections_module_css_default.quickFooter,
							children: [
								"选择后插入原生 ",
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: "/技能名" }),
								"，仍可继续编辑"
							]
						})
					]
				})]
			});
		}
		//#endregion
		//#region src/client/index.ts
		const inject = [
			"slots",
			"workspaces",
			"sessions",
			"remote",
			"remote.session",
			"remote.skills"
		];
		let openHostPath;
		let readCatalog;
		let watchDirectory;
		const catalogListeners = /* @__PURE__ */ new Set();
		function subscribeCatalogChanges(listener, sessionId) {
			catalogListeners.add(listener);
			const stop = sessionId === void 0 ? void 0 : watchDirectory?.(sessionId, () => listener(sessionId));
			return () => {
				catalogListeners.delete(listener);
				stop?.();
			};
		}
		async function listAvailableSkills(sessionId, signal) {
			if (readCatalog === void 0) throw new Error("原生会话 Skill 目录不可用，请刷新页面后重试");
			return readCatalog(sessionId, signal);
		}
		async function openPath(path) {
			if (openHostPath === void 0) throw new Error("Host 路径打开能力不可用");
			await openHostPath(path);
		}
		async function rpc(endpoint, args = {}) {
			const response = await fetch(`/dsh-skill-collections-api/${endpoint}`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(args)
			});
			const data = await response.json().catch(() => null);
			if (!response.ok || !data?.ok) throw new Error(data?.error?.message ?? `Skill collections request failed (${response.status})`);
			return data.value;
		}
		function apply(ctx) {
			ctx.effect(installStyles, "dsh-skill-collections: styles");
			ctx.effect(() => () => {
				openHostPath = void 0;
				readCatalog = void 0;
				watchDirectory = void 0;
			}, "dsh-skill-collections: remote cleanup");
			ctx.effect(() => {
				const notify = (sessionId) => {
					for (const listener of catalogListeners) listener(sessionId);
				};
				const disposers = [
					ctx.remote.$on("agent-preset/selected", (sessionId) => notify(String(sessionId))),
					ctx.remote.$on("plugin-manager/changed", () => notify()),
					ctx.on("connection/reset", () => notify())
				];
				return () => {
					for (const dispose of disposers) dispose();
					catalogListeners.clear();
				};
			}, "dsh-skill-collections: catalog invalidation");
			const sessions = ctx.sessions;
			watchDirectory = (sessionId, changed) => ctx.effect(() => {
				const read = () => {
					const values = sessions.list.getSnapshot().projectionsBySession[sessionId]?.values;
					return typeof values?.workingDirectory === "string" ? values.workingDirectory : void 0;
				};
				let previous = read();
				return sessions.list.subscribe(() => {
					const next = read();
					if (next !== void 0 && next !== previous) {
						previous = next;
						changed();
					}
				});
			}, "dsh-skill-collections: selected session directory");
			readCatalog = async (sessionId, signal) => {
				return sessions.using(sessionId, {
					source: "skillCollectionsCatalog",
					signal
				}, async (reference) => {
					signal.throwIfAborted();
					const state = reference.binding.session.getSnapshot();
					if (state.openState !== "open") throw new Error(state.openError?.message ?? "会话尚未打开，无法读取原生 Skill 目录");
					const result = await ctx.remote.skills.list({ sessionId }, signal);
					signal.throwIfAborted();
					if (!result.ok) throw new Error(`原生 Skill 目录读取失败：${result.error.message}`);
					return result.value.skills;
				});
			};
			openHostPath = async (path) => {
				const result = await ctx.remote.session.openWorkspacePath({ path });
				if (!result.ok) throw new Error(result.error.message);
			};
			ctx.effect(() => ctx.slots.inject("conversation.input.right", () => ctx.slots.register({
				name: "conversation.input.right",
				id: "skill-collections-management-entry",
				order: 99,
				label: "Skill 管理"
			}, SkillManagementEntry)), "dsh-skill-collections: management entry");
			ctx.effect(() => ctx.slots.inject("conversation.input.right", () => ctx.slots.register({
				name: "conversation.input.right",
				id: "skill-collections-picker",
				order: 100,
				label: "Skill 快捷入口"
			}, SkillQuickPicker)), "dsh-skill-collections: composer picker");
			ctx.effect(() => ctx.slots.inject("conversation.input.overlay", () => ctx.slots.register({
				name: "conversation.input.overlay",
				id: "skill-collections-management-overlay",
				order: 0
			}, SkillManagementOverlay)), "dsh-skill-collections: management overlay");
			ctx.effect(() => ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "skill-collections",
				order: 26,
				label: () => "Skill 收藏夹",
				component: SkillCollectionsPanel
			}, SkillCollectionsPanel)), "dsh-skill-collections: settings section");
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		exports.listAvailableSkills = listAvailableSkills;
		exports.openPath = openPath;
		exports.rpc = rpc;
		exports.subscribeCatalogChanges = subscribeCatalogChanges;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map