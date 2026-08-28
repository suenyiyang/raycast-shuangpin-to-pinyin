/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** 默认双拼方案 - 打开转换界面时默认使用的双拼布局 */
  "defaultScheme": "xiaohe" | "apple-default" | "sogou" | "pinyin-jiajia" | "microsoft" | "common",
  /** 剪贴板回退 - 当当前 App 没有向 Raycast 暴露选区时，尝试转换剪贴板中的文本 */
  "fallbackToClipboard": boolean
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `convert-selected-text` command */
  export type ConvertSelectedText = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `convert-selected-text` command */
  export type ConvertSelectedText = {}
}

