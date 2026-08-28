import {
  Action,
  ActionPanel,
  Clipboard,
  Icon,
  Keyboard,
  List,
  getPreferenceValues,
  getSelectedText,
} from "@raycast/api";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ConversionError, convertShuangpin, type ConversionResult } from "./converter";
import { SCHEME_IDS, SCHEMES, isSchemeId, type SchemeId } from "./schemes";

interface Preferences {
  defaultScheme: SchemeId;
  fallbackToClipboard: boolean;
}

type SourceKind = "selection" | "clipboard" | "manual";

type ConversionState =
  { kind: "result"; result: ConversionResult } | { kind: "error"; error: ConversionError } | undefined;

function previewText(text: string): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  return oneLine.length > 48 ? `${oneLine.slice(0, 47)}…` : oneLine;
}

export default function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const [schemeId, setSchemeId] = useState<SchemeId>(preferences.defaultScheme);
  const [inputText, setInputText] = useState("");
  const [sourceKind, setSourceKind] = useState<SourceKind>("manual");
  const [sourceError, setSourceError] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);

  const loadSource = useCallback(async () => {
    setIsLoading(true);
    setSourceError(undefined);

    try {
      const selectedText = await getSelectedText();
      setInputText(selectedText);
      setSourceKind("selection");
    } catch (selectionError) {
      if (!preferences.fallbackToClipboard) {
        setInputText("");
        setSourceKind("manual");
        setSourceError(`无法读取选中文本：${String(selectionError)}`);
        setIsLoading(false);
        return;
      }

      const clipboardText = await Clipboard.readText();
      if (clipboardText) {
        setInputText(clipboardText);
        setSourceKind("clipboard");
      } else {
        setInputText("");
        setSourceKind("manual");
        setSourceError("没有选中文本，剪贴板中也没有可转换的文字");
      }
    } finally {
      setIsLoading(false);
    }
  }, [preferences.fallbackToClipboard]);

  useEffect(() => {
    void loadSource();
  }, [loadSource]);

  const conversion: ConversionState = useMemo(() => {
    if (!inputText.trim()) {
      return undefined;
    }

    try {
      return { kind: "result", result: convertShuangpin(inputText, schemeId) };
    } catch (error) {
      if (error instanceof ConversionError) {
        return { kind: "error", error };
      }
      return { kind: "error", error: new ConversionError("invalid-characters", String(error)) };
    }
  }, [inputText, schemeId]);

  const scheme = SCHEMES[schemeId];
  const sourceLabel = {
    selection: "选中文本",
    clipboard: "剪贴板",
    manual: "手动输入",
  }[sourceKind];

  return (
    <List
      isLoading={isLoading}
      filtering={false}
      navigationTitle="双拼转全拼"
      searchText={inputText}
      onSearchTextChange={(text) => {
        setInputText(text);
        setSourceKind("manual");
        setSourceError(undefined);
      }}
      searchBarPlaceholder="输入或粘贴双拼及其他文本…"
      searchBarAccessory={
        <List.Dropdown
          tooltip="选择双拼方案"
          defaultValue={preferences.defaultScheme}
          storeValue
          onChange={(value) => {
            if (isSchemeId(value)) {
              setSchemeId(value);
            }
          }}
        >
          {SCHEME_IDS.map((id) => (
            <List.Dropdown.Item key={id} title={SCHEMES[id].title} value={id} />
          ))}
        </List.Dropdown>
      }
    >
      {!isLoading && !inputText.trim() ? (
        <List.EmptyView
          icon={Icon.TextInput}
          title="输入双拼编码"
          description={
            sourceError ? `${sourceError}。也可以直接在上方输入。` : "直接在上方输入，结果会实时显示。"
          }
        />
      ) : null}

      {!isLoading && conversion?.kind === "error" ? (
        <List.EmptyView
          icon={Icon.ExclamationMark}
          title="当前方案无法转换"
          description={`${conversion.error.message}。可按 ⌘P 切换双拼方案。`}
        />
      ) : null}

      {conversion?.kind === "result" ? (
        <List.Section
          title={`${sourceLabel}：${previewText(inputText)}`}
          subtitle={`${scheme.title}${conversion.result.pairs.length > 0 ? ` · ${conversion.result.pairs.join(" · ")}` : ""}`}
        >
          {conversion.result.candidates.map((candidate) => (
            <List.Item
              key={`${candidate.output}-${candidate.syllables.join("-")}`}
              icon={Icon.Text}
              title={candidate.output}
              subtitle={candidate.syllables.length > 0 ? candidate.syllables.join(" · ") : "原文保留"}
              accessories={[{ text: scheme.shortTitle }]}
              keywords={candidate.syllables}
              actions={
                <ActionPanel>
                  <ActionPanel.Section>
                    <Action.Paste title="替换为这个全拼" content={candidate.output} icon={Icon.ArrowRight} />
                    <Action.CopyToClipboard
                      title="复制全拼"
                      content={candidate.output}
                      shortcut={{ modifiers: ["cmd"], key: "c" }}
                    />
                  </ActionPanel.Section>
                  <ActionPanel.Section>
                    <Action
                      title="重新读取选中文本"
                      icon={Icon.ArrowClockwise}
                      shortcut={Keyboard.Shortcut.Common.Refresh}
                      onAction={loadSource}
                    />
                  </ActionPanel.Section>
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      ) : null}
    </List>
  );
}
